'use strict';

/*
 * Given a full path (no path-resolution is performed), find all the files underneath that
 * path (to the leaves of the directory tree), excluding any node_modules subdirectories.
 * Collect stat information about each file and join the information together in a string, 
 * then return that string. 
 */
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

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

      return paths.concat(getFileInfos(path.join(fullPath, entry)));
    }, []);
  } else {
    throw new Error('"' + fullPath + '": Unexpected file type');
  }
}

function stringifyFileInfo(fileInfo) {
  return '|' + fileInfo.mtime + '|' + fileInfo.mode + '|' + fileInfo.size;
}

module.exports = function hashTree(fullPath) {
  
  var strings = getFileInfos(fullPath).sort().map(stringifyFileInfo).join();

  // Once we drop Node < 6 support, we can simplify this code to Buffer.from
  var buf = (typeof Buffer.from === 'function' ? Buffer.from(strings) : (new Buffer(strings, 'utf8')));

  return crypto.createHash('md5').update(buf).digest('hex');
};

module.exports.stringifyFileInfo = stringifyFileInfo;
module.exports.getFileInfos = getFileInfos;
