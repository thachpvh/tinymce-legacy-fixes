import { describe, it } from '@ephox/bedrock-client';
import { assert } from 'chai';

import * as Uuid from 'tinymce/core/util/Uuid';

describe('atomic.tinymce.core.util.UuidTest', () => {
  it('should generate unique IDs with the requested prefix', () => {
    const one = Uuid.uuid('mce');
    const two = Uuid.uuid('mce');

    assert.match(one, /^mce[0-9]+s[0-9a-z]+$/);
    assert.match(two, /^mce[0-9]+s[0-9a-z]+$/);
    assert.notEqual(one, two);
  });
});
