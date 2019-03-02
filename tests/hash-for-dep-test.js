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

    // NOTE: the order of the following is affected by how the hash-for-dep processing occurs
    var hashTreePaths = [
      path.join(fixturesPath, 'node_modules', 'foo'),
      path.join(fixturesPath, 'node_modules', 'foo', 'node_modules', 'bar'),
      path.join(fixturesPath, 'node_modules', 'dedupped'),
      path.join(fixturesPath, 'node_modules', 'dedupped', 'node_modules', 'dedupped-child')
    ];

    var result = hashForDep('foo', fixturesPath, function stableHashTreeOverride(statPath) {
      hashTreeCallCount++;
      assert.equal(statPath, hashTreePaths.shift(), 'hashTree override has correct path');
      return 42;
    });

    assert.equal(hashTreeCallCount, 4, 'hashTree override was called correct number of times');
    assert.equal(result, 'b2d270f1274267a5fe29a49b5d44bb86125977f9', 'Expected sha1');
  });

  it('does not error when an empty node_module directories shadows a higher level package (npm@5.5.1)', function() {
    var hashTreeCallCount = 0;
    var hashTreePaths = [
      path.join(fixturesPath, 'node_modules', 'empty-node-modules-directories'),
      path.join(fixturesPath, 'node_modules', 'dedupped'),
      path.join(fixturesPath, 'node_modules', 'dedupped', 'node_modules', 'dedupped-child')
    ];

    var result = hashForDep('empty-node-modules-directories', fixturesPath, function stableHashTreeOverride(statPath) {
      hashTreeCallCount++;
      assert.equal(statPath, hashTreePaths.shift(), 'hashTree override has correct path');
      return 42;
    });

    assert.equal(hashTreeCallCount, 3, 'hashTree override was called correct number of times');
    assert.equal(result, 'e865cf8af067a03197e390c5c0adab43507469ee', 'Expected sha1');
  });

  it('properly handles being provided an absolute path', function() {
    var hashTreeCallCount = 0;
    var hashTreePaths = [
      path.join(fixturesPath, 'node_modules', 'foo'),
      path.join(fixturesPath, 'node_modules', 'foo', 'node_modules', 'bar'),
      path.join(fixturesPath, 'node_modules', 'dedupped'),
      path.join(fixturesPath, 'node_modules', 'dedupped', 'node_modules', 'dedupped-child')
    ];

    var result = hashForDep(path.join(fixturesPath, 'node_modules', 'foo'), undefined, function stableHashTreeOverride(statPath) {
      hashTreeCallCount++;
      assert.equal(statPath, hashTreePaths.shift(), 'hashTree override has correct path');
      return 42;
    });

    assert.equal(hashTreeCallCount, 4, 'hashTree override was called correct number of times');
    assert.equal(result, 'b2d270f1274267a5fe29a49b5d44bb86125977f9', 'Expected sha1');
  });

  it('maintains compatibility for now, not erroring for garbage input', function() {
    expect(hashForDep('garbage-non-existing')).to.eql('c5c7d7981c22e790055a9b6e98a2972b8d14a599');
    expect(hashForDep('garbage-non-existing', 'with-garbage-basedir')).to.eql('507cb109ec6bd0781751f7eb65faf98183c79375');
  });

  describe('cache', function() {
    it('caches', function() {
      expect(hashForDep._cache.size).to.eql(0);

      var first = hashForDep('foo', fixturesPath);

      expect(hashForDep._cache.size).to.eql(4);

      var second = hashForDep('foo', fixturesPath);

      expect(first).to.eql(second);
      expect(hashForDep._cache.size).to.eql(4);

      hashForDep._resetCache();

      expect(hashForDep._cache.size).to.eql(0);

      first = hashForDep('foo', fixturesPath);

      expect(hashForDep._cache.size).to.eql(4);

      second = hashForDep('foo', fixturesPath);

      expect(hashForDep._cache.size).to.eql(4);
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

    it('all cache sizes', function() {
      expect(hashForDep._cache.size).to.eql(0);

      hashForDep('foo', fixturesPath);

      expect(hashForDep._cache.size).to.eql(4);
      expect(hashForDep._caches.MODULE_ENTRY.size).to.eql(4);
      expect(hashForDep._caches.PATH.size).to.eql(9);
    });
  });
});
