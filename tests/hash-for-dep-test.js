'use strict';
var path = require('path');
var assert = require('assert');
var hashForDep = require('../');
var expect = require('chai').expect;

var fixturesPath = path.join(__dirname, 'fixtures');

describe('hashForDep', function() {
  afterEach(function() {
    hashForDep._resetCache();
  });

  it('Provides a consistent sha1 hash for a dependent package', function() {
    var hashTreeCallCount = 0;
    var hashTreePaths = [
      path.join(fixturesPath, '/node_modules/dedupped/'),
      path.join(fixturesPath, '/node_modules/dedupped/node_modules/dedupped-child/'),
      path.join(fixturesPath, '/node_modules/foo/')
    ];

    var result = hashForDep('foo', fixturesPath, function stableHashTreeOverride(statPath) {
      hashTreeCallCount++;
      assert.equal(statPath, hashTreePaths.shift(), 'hashTree override has correct path');
      return 42;
    });

    assert.equal(hashTreeCallCount, 3, 'hashTree override was called correct number of times');
    assert.equal(result, 'f7ea6f1a10c65f054dc3b094a693b0ff6d8f0fad', 'Expected sha1');
  });

  describe('cache', function() {
    it('caches', function() {
      expect(hashForDep._cache.size).to.eql(0);

      var first = hashForDep('foo', fixturesPath);

      expect(hashForDep._cache.size).to.eql(1);

      var second = hashForDep('foo', fixturesPath);

      expect(first).to.eql(second);
      expect(hashForDep._cache.size).to.eql(1);

      hashForDep._resetCache();

      expect(hashForDep._cache.size).to.eql(0);

      first = hashForDep('foo', fixturesPath);

      expect(hashForDep._cache.size).to.eql(1);

      second = hashForDep('foo', fixturesPath);

      expect(hashForDep._cache.size).to.eql(1);
      expect(first).to.eql(second);
    });

    it('skip cache, when given a custom hashTreOverride', function() {
      expect(hashForDep._cache.size).to.eql(0);

      var first = hashForDep('foo', fixturesPath, function() {});

      expect(hashForDep._cache.size).to.eql(0);

      var second = hashForDep('foo', fixturesPath, function() {});

      expect(first).to.eql(second);
      expect(hashForDep._cache.size).to.eql(0);

      hashForDep._resetCache();

      expect(hashForDep._cache.size).to.eql(0);

      first = hashForDep('foo', fixturesPath, function() {});

      expect(hashForDep._cache.size).to.eql(0);

      second = hashForDep('foo', fixturesPath, function() {});

      expect(hashForDep._cache.size).to.eql(0);
      expect(first).to.eql(second);
    });
  });
});
