'use strict';

var path = require('path');
var assert = require('chai').assert;
var hashTree = require('../lib/hash-tree');
var ModuleEntry = require('../lib/module-entry');
var CacheGroup = require('../lib/cache-group');

var fixturesPath = path.join(__dirname, 'fixtures');

var NAME = 'dedupped';
var VERSION = '1.0.0';
var ROOTDIR = path.join(fixturesPath, 'node_modules/dedupped');
var SOURCEHASH = '24';

var FOO_DIR_PATH =  path.join(fixturesPath, 'node_modules/foo');
var DEDUPPED_DIR_PATH = path.join(fixturesPath, 'node_modules/dedupped');

describe('ModuleEntry', function() {
  var caches;

  beforeEach(function() {
    caches = new CacheGroup();
  });

  it('creation', function() {
    var moduleEntry = new ModuleEntry(NAME, VERSION, ROOTDIR, SOURCEHASH);
    assert.equal(moduleEntry.name, NAME, 'name field must be inserted without changes');
    assert.equal(moduleEntry.version, VERSION, 'version field must be inserted without changes');
    assert.equal(moduleEntry.rootDir, ROOTDIR, 'rootDir field must be inserted without changes');
    assert.equal(moduleEntry._sourceHash, SOURCEHASH, '_sourceHash field must be inserted without changes');
    assert.isNull(moduleEntry._hash, '_hash field must be null');
    assert.isObject(moduleEntry._dependencies, '_dependencies must be an empty object');
  });

  it('._gatherDependencies', function() {
    // gatherDependencies only occurs during getHash().
    var moduleEntry = ModuleEntry.locate(caches, 'foo', fixturesPath, hashTree);

    var dependencies = Object.create(null);
    moduleEntry._gatherDependencies(dependencies);

    var keys = Object.keys(dependencies);
    assert.equal(keys.length, 4, 'should have 4 total dependencies transitively');

    assert.equal(keys[0],
                 FOO_DIR_PATH,
                 'first dependency should be to "foo" module');
    assert.equal(keys[1],
                 path.join(FOO_DIR_PATH, 'node_modules/bar'),
                 'second dependency should be to "foo/node_modules/bar" module');
    assert.equal(keys[2],
                 DEDUPPED_DIR_PATH,
                 'third dependency should be to "dedupped" module');
    assert.equal(keys[3],
                 path.join(DEDUPPED_DIR_PATH, '/node_modules/dedupped-child'),
                 'fourth dependency should be to "dedupped/node_modules/dedupped-child" module');
  });

  it('.locate (class method) with default hashTreeFn ', function() {
    var moduleEntry = ModuleEntry.locate(caches, 'foo', fixturesPath, hashTree);

    assert.equal(moduleEntry.rootDir,
                 FOO_DIR_PATH,
      'rootDir must be in node_modules/foo');
    assert.equal(Object.keys(moduleEntry._dependencies).length, 3, 'foo._dependencies must have 2 entries');

    // XXX we should check which dependencies they are.

    var hash1 = moduleEntry.getHash();

    caches = new CacheGroup();
    moduleEntry = ModuleEntry.locate(caches, 'foo', fixturesPath, hashTree);

    var hash2 = moduleEntry.getHash();

    assert.equal(hash1, hash2, 'getHash should return the same hash after clearing and recalculating');
  });

  it('.locate (class method) with non-default hashTreeFn', function() {
    var newHashFn = function() {
      return SOURCEHASH;
    };

    var moduleEntry = ModuleEntry.locate(caches, 'foo', fixturesPath, newHashFn);
    assert.equal(moduleEntry.rootDir, FOO_DIR_PATH, 'rootDir must be in node_modules/foo');
    assert.equal(Object.keys(moduleEntry._dependencies).length, 3, 'foo._dependencies must have 2 entries');

    var hash1 = moduleEntry.getHash();

    caches = new CacheGroup();
    moduleEntry = ModuleEntry.locate(caches, 'foo', fixturesPath, newHashFn);

    var hash2 = moduleEntry.getHash();

    assert.equal(hash1, hash2, 'getHash should return the same hash after clearing and recalculating');
  });

  it('.locate (class method) with invalid package', function() {
    var moduleEntry = ModuleEntry.locate(caches, 'foo2', fixturesPath, hashTree);
    var moduleEntry2 = ModuleEntry.locate(caches, 'foo2', fixturesPath, hashTree);
    assert.isNotNull(moduleEntry);
    var hash1 = moduleEntry.getHash();
    assert.isOk(typeof hash1 === 'string');
    assert.equal(hash1, moduleEntry2.getHash());
  });

  it('.getHash', function() {
    var moduleEntry = ModuleEntry.locate(caches, 'foo', fixturesPath, hashTree);

    var hash1 = moduleEntry.getHash();

    caches = new CacheGroup();
    moduleEntry = ModuleEntry.locate(caches, 'foo', fixturesPath, hashTree);

    var hash2 = moduleEntry.getHash();

    assert.equal(hash1, hash2, 'getHash should return the same hash after clearing and recalculating');
  });
});
