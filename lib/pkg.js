var resolvePkg = require('./resolve-pkg.js');
var moduleBaseDir = require('./module-base-dir.js');

/* @private
 *
 * given the name of a descendent module this module locates and returns its
 * package.json. In addition, it provides the path and baseDir.
 *
 * @method pkg
 * @param {String} name
 * @param {String} dir (optional) root directory to begin resolution
 */
module.exports = function pkg(name, dir) {
  if (name !== './') { name += '/'; }

  var modulePath = resolvePkg(name, dir);
  var baseDir = moduleBaseDir(modulePath, name);
  var package = require(baseDir + '/package.json');

  package.path = modulePath;
  package.baseDir = baseDir;

  return package;
};
