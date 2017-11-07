'use strict';
var fs = require('fs');
var path = require('path');
var assert = require('assert');
var resolvePkg = require('../lib/resolve-pkg');

var fixturesPath = path.join(__dirname, 'fixtures');

var symlinkDir = path.join(fixturesPath, '..', 'symlink');

describe('resolvePkg', function() {
  before(function () {
    try {
      fs.unlinkSync(symlinkDir);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    try {
        fs.symlinkSync('./fixtures/node_modules/dedupped', symlinkDir, 'dir');
    } catch (err) {
        // if fails then it is probably on Windows and lets try to create a junction
        fs.symlinkSync(path.join(fixturesPath, 'node_modules', 'dedupped') + '\\', symlinkDir, 'junction');
    }
  });

  after(function () {
    fs.unlinkSync(symlinkDir);
  });

  it('Resolves to the package.json path of the provided package', function() {
    assert.equal(resolvePkg('./'), path.resolve('./'));
    assert.equal(resolvePkg('foo', fixturesPath), path.join(fixturesPath, 'node_modules/foo/package.json'));
    assert.equal(resolvePkg('/my-cool/path/', fixturesPath), '/my-cool/path/');
  });

  it('Resolves to the module directory if no main entry is defined', function() {
    assert.equal(resolvePkg('no-main/', fixturesPath), path.join(fixturesPath, 'node_modules/no-main/package.json'));
  });

  it('does not error if package cannot be found', function() {
    assert.equal(resolvePkg('cannot-find-me', fixturesPath), null);
  });

  it('Don\'t preserve symlinks when resolving package', function() {
    assert.equal(resolvePkg('foo', symlinkDir), path.join(fixturesPath, 'node_modules/foo/package.json'));
  });
});
