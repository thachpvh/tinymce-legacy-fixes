/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import Editor from 'tinymce/core/api/Editor';
import AstNode from 'tinymce/core/api/html/Node';
import Tools from 'tinymce/core/api/util/Tools';
import URI from 'tinymce/core/api/util/URI';

import * as Settings from '../api/Settings';
import * as Nodes from './Nodes';
import * as Sanitize from './Sanitize';
import * as VideoScript from './VideoScript';

declare let unescape: any;

// URL bearing attributes that must be validated as DOM safe, matching the core SaxParser.
const filteredUrlAttrs = Tools.makeMap('src,href,data,background,action,formaction,poster,xlink:href');

// Placeholder attributes (data-mce-p-*) are attacker controlled, so unprefixed values are
// sanitized the same way the core parser sanitizes regular content: event handler attributes
// are dropped and url bearing attributes must be DOM safe (e.g. no `javascript:` URIs). See
// TINY-14357.
const isSafePlaceholderAttribute = (editor: Editor, elementName: string, name: string, value: string): boolean => {
  if (name.indexOf('on') === 0) {
    return false;
  }

  if (filteredUrlAttrs[name] && !URI.isDomSafe(value, elementName, editor.settings)) {
    return false;
  }

  return true;
};

const setup = (editor: Editor): void => {
  editor.on('preInit', () => {
    // Make sure that any messy HTML is retained inside these
    const specialElements = editor.schema.getSpecialElements();
    Tools.each('video audio iframe object'.split(' '), (name) => {
      specialElements[name] = new RegExp('<\/' + name + '[^>]*>', 'gi');
    });

    // Allow elements
    // editor.schema.addValidElements(
    //  'object[id|style|width|height|classid|codebase|*],embed[id|style|width|height|type|src|*],video[*],audio[*]'
    // );

    // Set allowFullscreen attribs as boolean
    const boolAttrs = editor.schema.getBoolAttrs();
    Tools.each('webkitallowfullscreen mozallowfullscreen allowfullscreen'.split(' '), (name) => {
      boolAttrs[name] = {};
    });

    // Converts iframe, video etc into placeholder images
    editor.parser.addNodeFilter('iframe,video,audio,object,embed,script',
      Nodes.placeHolderConverter(editor));

    // Replaces placeholder images with real elements for video, object, iframe etc
    editor.serializer.addAttributeFilter('data-mce-object', (nodes, name) => {
      let i = nodes.length;
      let node;
      let realElm;
      let ai;
      let attribs;
      let innerHtml;
      let innerNode;
      let realElmName;
      let className;

      while (i--) {
        node = nodes[i];
        if (!node.parent) {
          continue;
        }

        realElmName = node.attr(name);

        // Reject anything that is not a plain element name so it can never be turned into markup
        if (typeof realElmName !== 'string' || !/^[a-z][a-z0-9-]*$/i.test(realElmName)) {
          node.remove();
          continue;
        }

        // Only restore `script` placeholders whose source matches a configured `media_scripts`
        // entry, mirroring the trust check applied when the placeholder is first created (see
        // Nodes.ts). The editor schema treats `script` as a valid element by default, so without
        // this check an injected `data-mce-object="script"` payload would become an executable
        // script on serialization.
        if (realElmName === 'script') {
          const scriptSrc = node.attr('data-mce-p-src');
          if (typeof scriptSrc !== 'string' || !VideoScript.getVideoScriptMatch(Settings.getScripts(editor), scriptSrc)) {
            node.remove();
            continue;
          }
        }

        realElm = new AstNode(realElmName, 1);

        // Add width/height to everything but audio
        if (realElmName !== 'audio' && realElmName !== 'script') {
          className = node.attr('class');
          if (className && className.indexOf('mce-preview-object') !== -1) {
            realElm.attr({
              width: node.firstChild.attr('width'),
              height: node.firstChild.attr('height')
            });
          } else {
            realElm.attr({
              width: node.attr('width'),
              height: node.attr('height')
            });
          }
        }

        realElm.attr({
          style: node.attr('style')
        });

        // Unprefix all placeholder attributes, dropping any that are not safe to restore
        attribs = node.attributes;
        ai = attribs.length;
        while (ai--) {
          const attrName = attribs[ai].name;

          if (attrName.indexOf('data-mce-p-') === 0) {
            const unprefixedName = attrName.substr(11);
            const attrValue = attribs[ai].value;

            if (isSafePlaceholderAttribute(editor, realElmName, unprefixedName, attrValue)) {
              realElm.attr(unprefixedName, attrValue);
            }
          }
        }

        if (realElmName === 'script') {
          realElm.attr('type', 'text/javascript');
        }

        // Inject innerhtml
        innerHtml = node.attr('data-mce-html');
        if (innerHtml) {
          innerNode = new AstNode('#text', 3);
          innerNode.raw = true;
          innerNode.value = Sanitize.sanitize(editor, unescape(innerHtml));
          realElm.append(innerNode);
        }

        node.replace(realElm);
      }
    });
  });

  editor.on('SetContent', () => {
    // TODO: This shouldn't be needed there should be a way to mark bogus
    // elements so they are never removed except external save
    editor.$('span.mce-preview-object').each((index, elm) => {
      const $elm = editor.$(elm);

      if ($elm.find('span.mce-shim').length === 0) {
        $elm.append('<span class="mce-shim"></span>');
      }
    });
  });
};

export {
  setup
};
