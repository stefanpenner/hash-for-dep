'use strict';

var crypto = require('crypto');
var fs = require('fs');

function getFileInfos(fullPath) {
  var stat = fs.statSync(fullPath);

  if (stat.isFile()) {
    return [{
      fullPath: fullPath,
      mtime: stat.mtime.getTime(),
      mode: stat.mode,
      size: stat.size
    }];
  } else if (stat.isDirectory()) {
    // if it ends with node_modules do nothing
    return fs.readdirSync(fullPath).sort().reduce(function(paths, entry) {
      if (entry.toLowerCase() === 'node_modules') {
        return paths;
      }

      return paths.concat(getFileInfos(fullPath + '/' + entry));
    }, []);
  } else {
    throw new Error('"' + fullPath + '": Unexpected file type');
  }
}

function stringifyFileInfo(fileInfo) {
  return '\x00' + fileInfo.mtime + '\x00' + fileInfo.mode + '\x00' + fileInfo.size;
}

module.exports = function hashTree(fullPath) {
  var strings = getFileInfos(fullPath).map(stringifyFileInfo).join();
  return crypto.createHash('md5').update(Buffer.from(strings, 'utf8')).digest('hex');
};

module.exports.stringifyFileInfo = stringifyFileInfo;
module.exports.getFileInfos = getFileInfos;
