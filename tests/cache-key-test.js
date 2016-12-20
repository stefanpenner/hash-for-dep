'use strict';

var expect = require('chai').expect;
var cacheKey = require('../lib/cache-key');

describe('cacheKey', function() {
  it('produces reasonable a key', function() {
    expect(cacheKey('name', 'dir')).to.eql(cacheKey('name', 'dir'));
    expect(cacheKey('name', 'dir')).to.not.eql(cacheKey('name', 'dir1'));
    expect(cacheKey('name', 'dir')).to.not.eql(cacheKey('name1', 'dir'));
    expect(cacheKey('name', 'dir')).to.not.eql(cacheKey('name1', 'dir1'));
  });
});
