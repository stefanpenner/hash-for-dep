var helpers = require('broccoli-kitchen-sink-helpers');
var crypto = require('crypto');
var statPathsFor = require('./lib/stats-path-for');

/* @public
 *
 * @method hashForDep
 * @param {String} name name of the dependency
 * @param {String} dir (optional) root dir to run the hash resolving from
 * @return {String} a hash representing the stats of this module and all its descendents
 */
module.exports = function hashForDep(name, dir) {
  var inputHashes = statPathsFor(name, dir).map(helpers.hashTree).join(0x00);

  return crypto.createHash('md5').
    update(inputHashes).digest('hex');
};
