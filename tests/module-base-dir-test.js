'use strict';
var path = require('path');
var assert = require('assert');
var moduleBaseDir = require('../lib/module-base-dir');

var fixturesPath = path.join(__dirname, 'fixtures');
var foo = 'foo';
var fooModulePath = path.join(fixturesPath, 'node_modules', foo);

describe('moduleBaseDir', function() {
  it('Locates the true root directory for a module', function() {
    assert.equal(moduleBaseDir(fooModulePath, foo), fooModulePath);
    assert.equal(moduleBaseDir(fooModulePath + '/asdf.js', foo), fooModulePath);
    assert.equal(moduleBaseDir(fooModulePath + '/index.js', foo), fooModulePath);
    assert.equal(moduleBaseDir(fooModulePath + '/lib/index.js', foo), fooModulePath);
  });
});