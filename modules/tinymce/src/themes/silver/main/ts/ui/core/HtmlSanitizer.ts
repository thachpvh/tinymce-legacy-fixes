/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import * as DOMPurify from 'dompurify';

const purifier = (DOMPurify as unknown as { default: typeof DOMPurify }).default;

export const sanitizeHtmlString = (html: string): string => purifier.sanitize(html);
