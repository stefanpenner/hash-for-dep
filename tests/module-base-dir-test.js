'use strict';
var path = require('path');
var assert = require('assert');
var moduleBaseDir = require('../lib/module-base-dir');

describe('moduleBaseDir', function() {
  it('Locates the true root directory for a module', function() {
    var fixturesPath = path.join(__dirname, 'fixtures');
    var foo = 'foo';
    var fooModulePath = path.join(fixturesPath, 'node_modules', foo);

    assert.equal(moduleBaseDir(fooModulePath, foo), fooModulePath);
    assert.equal(moduleBaseDir(fooModulePath + '/asdf.js', foo), fooModulePath);
    assert.equal(moduleBaseDir(fooModulePath + '/index.js', foo), fooModulePath);
    assert.equal(moduleBaseDir(fooModulePath + '/lib/index.js', foo), fooModulePath);
  });

  it('Handles going up a folder', function() {
    var modulePath = path.normalize('broccoli-persistent-filter/node_modules/hash-for-dep/index.js');
    var moduleName = path.normalize('../');

    var expected = path.normalize('broccoli-persistent-filter/node_modules/hash-for-dep/');
    var actual = moduleBaseDir(modulePath, moduleName);

    assert.equal(actual, expected);
  });

  it('Handles Linux separators', function() {
    var modulePath = 'broccoli-persistent-filter/node_modules/broccoli-kitchen-sink-helpers/node_modules/glob/glob.js';
    var moduleName = 'glob/';

    var expected = path.normalize('broccoli-persistent-filter/node_modules/broccoli-kitchen-sink-helpers/node_modules/glob/');
    var actual = moduleBaseDir(modulePath, moduleName);

    assert.equal(actual, expected);
  });

  it('Handles Windows separators', function() {
    var modulePath = 'broccoli-persistent-filter\\node_modules\\broccoli-kitchen-sink-helpers\\node_modules\\glob\\glob.js';
    var moduleName = 'glob\\';

    var expected = path.normalize('broccoli-persistent-filter/node_modules/broccoli-kitchen-sink-helpers/node_modules/glob/');
    var actual = moduleBaseDir(modulePath, moduleName);

    assert.equal(actual, expected);
  });
});