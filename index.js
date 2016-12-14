'use strict';
var helpers = require('broccoli-kitchen-sink-helpers');
var crypto = require('crypto');
var statPathsFor = require('./lib/stat-paths-for');
var heimdall = require('heimdalljs');

function HashForDepSchema() {
  this.paths = 0;
}

/* @public
 *
 * @method hashForDep
 * @param {String} name name of the dependency
 * @param {String} dir (optional) root dir to run the hash resolving from
 * @param {String} _hashTreeOverride (optional) private, used internally for testing
 * @return {String} a hash representing the stats of this module and all its descendents
 */
module.exports = function hashForDep(name, dir, _hashTreeOverride) {
  var heimdallNodeOptions = {
    name: 'hashForDep(' + name + ')',
    hashForDep: true,
    dependencyName: name,
    rootDir: dir
  };

  var heimdallNode = heimdall.start(heimdallNodeOptions, HashForDepSchema);

  var inputHashes = statPathsFor(name, dir).map(function(statPath) {
    var hashFn = _hashTreeOverride || helpers.hashTree;

    heimdallNode.stats.paths++;

    return hashFn(statPath);
  }).join(0x00);

  var hash = crypto.createHash('sha1').
      update(inputHashes).digest('hex');

  heimdallNode.stop();

  return hash;
};
