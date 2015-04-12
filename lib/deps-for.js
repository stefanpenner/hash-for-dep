var pkg = require('./pkg');

/* @private
 * 
 * constructs a set of all dependencies recursivel
 *
 * @method depsFor
 * @param {String} name of package to assemble unique deps for
 * @param {String} dir (optional) path to begin resolving from
 * @return {Array} a unique set of all deps
 */
module.exports = function depsFor(name, dir) {
  var dependencies = [];
  var visited = Object.create(null);

  (function again(name, dir) {
    var package = pkg(name, dir);
    var key = package.name + package.version + package.baseDir;

    if (visited[key]) { return; }
    visited[key] = true;

    dependencies.push(package);

    return Object.keys(package.dependencies || {}).forEach(function(dep) {
      again(dep, package.baseDir);
    });
  }(name, dir));

  return dependencies;
};

