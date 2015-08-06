'use strict';
var path = require('path');

/*
 * @private
 *
 * when using require.resolve, the entry files location is provided. This
 * utility attempts to locate the true root directory.
 *
 * given:  /path/to/project/node_modules/library/lib/index.js + library
 * we get: /path/to/project/node_modules/library
 *
 * @method moduleBaseDir
 * @param modulePath {String}
 * @param moduleName {String}
 * @return {String} the root directory of a given module
 *
 */
module.exports = function moduleBaseDir(modulePath, moduleName) {
  var segment = 'node_modules' + path.sep + moduleName;
  return modulePath.replace(new RegExp(segment + '.*$'), segment).replace(/index\.js\/?$/, '');
};
