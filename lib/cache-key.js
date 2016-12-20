'use strict';
var crypto = require('crypto');

module.exports = function cacheKey(name, dir, _hashTreeOverride) {
  var value = name + 0x00 + dir + 0x00 + (typeof _hashTreeOverride === 'function');

  return crypto.createHash('sha1').update(value).digest('hex');
};
