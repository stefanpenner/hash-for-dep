'use strict';

var assert = require('assert');
var fs = require('fs');
var hashTree = require('../lib/hash-tree');
var path = require('path');

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
    }), '|5|6|7');
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
    // NOTE: doing this on a directory no other test in the suite uses, since
    // the mtime will change and modify the hash value.
    var first = hashTree(__dirname + '/fixtures/node_modules/to-check-for-changes');
    var INDEX_FILE_PATH = __dirname + '/fixtures/node_modules/to-check-for-changes/index.js';

    var original = fs.readFileSync(INDEX_FILE_PATH);

    try {
      fs.writeFileSync(INDEX_FILE_PATH, original + 'SOMETHING NEW');
      assert.notEqual(first, hashTree(__dirname + '/fixtures/node_modules/to-check-for-changes'));
    } finally {
      fs.writeFileSync(INDEX_FILE_PATH, original);
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
        path.normalize('/fixtures/node_modules/foo/index.js'),
        path.normalize('/fixtures/node_modules/foo/package.json')
      ]);

      assertValidLookingFileInfos(fileInfos);
    });

    it('handles fixtures/node_modules/dedupped correctly', function() {
      var fileInfos = getFileInfos(__dirname + '/fixtures/node_modules/dedupped');
      var paths = fileInfos.map(byRelativePath);

      assert.deepEqual(paths, [
        path.normalize('/fixtures/node_modules/dedupped/index.js'),
        path.normalize('/fixtures/node_modules/dedupped/package.json')
      ]);
      assertValidLookingFileInfos(fileInfos);
    });

    it('handles fixtures/node_modules/no-main correctly', function() {
      var fileInfos = getFileInfos(__dirname + '/fixtures/node_modules/no-main');
      var paths = fileInfos.map(byRelativePath);

      assert.deepEqual(paths, [
        path.normalize('/fixtures/node_modules/no-main/package.json')
      ]);
      assertValidLookingFileInfos(fileInfos);
    });

    it('handles fixtures/node_modules/with-nested-dirs correctly', function() {
      var fileInfos = getFileInfos(__dirname + '/fixtures/node_modules/with-nested-dirs');
      var paths = fileInfos.map(byRelativePath);

      assert.deepEqual(paths, [
        path.normalize('/fixtures/node_modules/with-nested-dirs/child/grand-child/index.js'),
        path.normalize('/fixtures/node_modules/with-nested-dirs/child/index.js'),
        path.normalize('/fixtures/node_modules/with-nested-dirs/index.js')
      ]);
      assertValidLookingFileInfos(fileInfos);
    });

    it('handles cycle', function() {
      try {
        fs.unlinkSync(__dirname + '/fixtures/contains-cycle/is-cycle');
      } catch (e) {
        if (typeof e === 'object' && e !== null && e.code === 'ENOENT') {
          // handle
        } else {
          throw e;
        }
      }

      fs.symlinkSync(__dirname + '/fixtures/contains-cycle/', __dirname + '/fixtures/contains-cycle/is-cycle');

      assert.deepEqual(getFileInfos(__dirname + '/fixtures/contains-cycle'), []);
    });

    it('handles broken symlink', function() {
      try {
        fs.unlinkSync(__dirname + '/fixtures/broken-symlink/broken-symlink');
      } catch (e) {
        if (typeof e === 'object' && e !== null && e.code === 'ENOENT') {
          // handle
        } else {
          throw e;
        }
      }

      fs.symlinkSync('does-not-exist', __dirname + '/fixtures/broken-symlink/broken-symlink');

      assert.deepEqual(getFileInfos(__dirname + '/fixtures/broken-symlink'), ['missing']);
    });
  });
});
