'use strict';
var pkg = require('./pkg');
var debug = require('debug')('hash-for-dep:deps-for');
var time = require('./timing');

/* @private
 *
 * constructs a set of all dependencies recursively
 *
 * @method depsFor
 * @param {String} name of package to assemble unique deps for
 * @param {String} dir (optional) path to begin resolving from
 * @return {Array} a unique set of all deps
 */
module.exports = function depsFor(name, dir) {
  var dependencies = [];
  var visited = Object.create(null);
  var start = time.start();

  (function again(name, dir) {
    var thePackage = pkg(name, dir);
    var key = thePackage.name + thePackage.version + thePackage.baseDir;

    if (visited[key]) { return; }
    visited[key] = true;

    dependencies.push(thePackage);

    return Object.keys(thePackage.dependencies || {}).forEach(function(dep) {
      again(dep, thePackage.baseDir);
    });
  }(name, dir));

  debug('dep discovery stats: %o', {
    dependencies: dependencies.length,
    elapsedTime: time.end(start)
  });

  return dependencies;
};
