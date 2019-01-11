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
      path.join(fixturesPath, '/node_modules/foo/'),
      path.join(fixturesPath, '/node_modules/foo/node_modules/bar/')
    ];

    var result = hashForDep('foo', fixturesPath, function stableHashTreeOverride(statPath) {
      hashTreeCallCount++;
      assert.equal(statPath, hashTreePaths.shift(), 'hashTree override has correct path');
      return 42;
    });

    assert.equal(hashTreeCallCount, 4, 'hashTree override was called correct number of times');
    assert.equal(result, 'c50b4fd6f7d64c1d81c9ec08c42e72fd27fc0f8c', 'Expected sha1');
  });

  it('does not error when an empty node_module directories shadows a higher level package (npm@5.5.1)', function() {
    var hashTreeCallCount = 0;
    var hashTreePaths = [
      path.join(fixturesPath, '/node_modules/dedupped/'),
      path.join(fixturesPath, '/node_modules/dedupped/node_modules/dedupped-child/'),
      path.join(fixturesPath, '/node_modules/empty-node-modules-directories/')
    ];

    var result = hashForDep('empty-node-modules-directories', fixturesPath, function stableHashTreeOverride(statPath) {
      hashTreeCallCount++;
      assert.equal(statPath, hashTreePaths.shift(), 'hashTree override has correct path');
      return 42;
    });

    assert.equal(hashTreeCallCount, 3, 'hashTree override was called correct number of times');
    assert.equal(result, 'f7ea6f1a10c65f054dc3b094a693b0ff6d8f0fad', 'Expected sha1');
  });

  it('properly handles being provided an absolute path', function() {
    var hashTreeCallCount = 0;
    var hashTreePaths = [
      path.join(fixturesPath, '/node_modules/dedupped/'),
      path.join(fixturesPath, '/node_modules/dedupped/node_modules/dedupped-child/'),
      path.join(fixturesPath, '/node_modules/foo/'),
      path.join(fixturesPath, '/node_modules/foo/node_modules/bar/')
    ];

    var result = hashForDep(path.join(fixturesPath, 'node_modules', 'foo'), undefined, function stableHashTreeOverride(statPath) {
      hashTreeCallCount++;
      assert.equal(statPath, hashTreePaths.shift(), 'hashTree override has correct path');
      return 42;
    });

    assert.equal(hashTreeCallCount, 4, 'hashTree override was called correct number of times');
    assert.equal(result, 'c50b4fd6f7d64c1d81c9ec08c42e72fd27fc0f8c', 'Expected sha1');
  });

  describe('cache', function() {
    it('caches', function() {
      expect(hashForDep._cache.size).to.eql(0);

      var first = hashForDep('foo', fixturesPath);

      expect(hashForDep._cache.size).to.eql(5);

      var second = hashForDep('foo', fixturesPath);

      expect(first).to.eql(second);
      expect(hashForDep._cache.size).to.eql(5);

      hashForDep._resetCache();

      expect(hashForDep._cache.size).to.eql(0);

      first = hashForDep('foo', fixturesPath);

      expect(hashForDep._cache.size).to.eql(5);

      second = hashForDep('foo', fixturesPath);

      expect(hashForDep._cache.size).to.eql(5);
      expect(first).to.eql(second);
    });

    it('skips cache, when given a custom hashTreeOverride', function() {
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
