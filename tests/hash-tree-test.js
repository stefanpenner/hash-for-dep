'use strict';

var assert = require('assert');
var fs = require('fs');
var hashTree = require('../lib/hash-tree');

function byRelativePath(info) {
  return info.fullPath.replace(__dirname, '');
}

function assertValidLookingFileInfos(fileInfos) {
  fileInfos.forEach(function(fileInfo) {
    assert.ok(typeof fileInfo.fullPath === 'string');
    assert.ok(typeof fileInfo.mtime === 'number');
    assert.ok(typeof fileInfo.mode === 'number');
    assert.ok(typeof fileInfo.size === 'number');
  });
}

describe('stringifyFileInfo', function() {
  var stringifyFileInfo = hashTree.stringifyFileInfo;
  it('works', function() {
    assert.strictEqual(stringifyFileInfo({
      fullPath: 'OMG',
      mtime: 5,
      mode: 6,
      size: 7
    }), '\x005\x006\x007');
  });
});

describe('hashTree', function() {
  it('emits output the looks right', function() {
    var foo = hashTree(__dirname + '/fixtures/node_modules/foo');
    assert.ok(typeof foo === 'string');
    assert.strictEqual(foo.length, 32);
  });

  it('has output stays stable', function() {
    assert.strictEqual(hashTree(__dirname + '/fixtures/node_modules/foo'), hashTree(__dirname + '/fixtures/node_modules/foo'));
  });

  it('if the tree changes, the hash changes', function() {
    var first = hashTree(__dirname + '/fixtures/node_modules/foo');
    var original = fs.readFileSync(__dirname + '/fixtures/node_modules/foo/index.js');

    try {
      fs.writeFileSync(__dirname + '/fixtures/node_modules/foo/index.js', original + 'SOMETHING NEW');
      assert.notEqual(first, hashTree(__dirname + '/fixtures/node_modules/foo'));
    } finally {
      fs.writeFileSync(__dirname + '/fixtures/node_modules/foo/index.js', original);
    }
  });
});

describe('getFileInfos', function() {
  var getFileInfos = hashTree.getFileInfos;
  describe('does not traverse node_modules', function() {
    it('handles fixtures/node_modules/foo correctly', function() {
      var fileInfos = getFileInfos(__dirname + '/fixtures/node_modules/foo');
      var paths = fileInfos.map(byRelativePath);

      assert.deepEqual(paths, [
        '/fixtures/node_modules/foo/index.js',
        '/fixtures/node_modules/foo/package.json'
      ]);

      assertValidLookingFileInfos(fileInfos);
    });

    it('handles fixtures/node_modules/dedupped correctly', function() {
      var fileInfos = getFileInfos(__dirname + '/fixtures/node_modules/dedupped');
      var paths = fileInfos.map(byRelativePath);

      assert.deepEqual(paths, [
        '/fixtures/node_modules/dedupped/index.js',
        '/fixtures/node_modules/dedupped/package.json'
      ]);
      assertValidLookingFileInfos(fileInfos);
    });

    it('handles fixtures/node_modules/no-main correctly', function() {
      var fileInfos = getFileInfos(__dirname + '/fixtures/node_modules/no-main');
      var paths = fileInfos.map(byRelativePath);

      assert.deepEqual(paths, [
        '/fixtures/node_modules/no-main/package.json'
      ]);
      assertValidLookingFileInfos(fileInfos);
    });

    it('handles fixtures/node_modules/with-nested-dirs correctly', function() {
      var fileInfos = getFileInfos(__dirname + '/fixtures/node_modules/with-nested-dirs');
      var paths = fileInfos.map(byRelativePath);

      assert.deepEqual(paths, [
      '/fixtures/node_modules/with-nested-dirs/child/grand-child/index.js',
      '/fixtures/node_modules/with-nested-dirs/child/index.js',
      '/fixtures/node_modules/with-nested-dirs/index.js'
      ]);
      assertValidLookingFileInfos(fileInfos);
    });
  });
});
