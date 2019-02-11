'use strict';

var assert = require('assert');
var CacheGroup = require('../lib/cache-group');
var Cache = require('../lib/cache');

describe('CacheGroup', function() {
  it('looks right', function() {
    var cacheGroup = new CacheGroup();
    assert.ok(cacheGroup.MODULE_ENTRY instanceof Cache);
    assert.ok(cacheGroup.PATH instanceof Cache);
    assert.ok(cacheGroup.REAL_FILE_PATH instanceof Cache);
    assert.ok(cacheGroup.REAL_DIRECTORY_PATH instanceof Cache);
  });
});
