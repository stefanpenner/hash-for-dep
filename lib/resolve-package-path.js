'use strict';

var fs = require('fs');
var path = require('path');
var pathRoot = require('path-root');

/*
 * Define a regex that will match against the 'name' value passed into
 * resolvePackagePath. The regex corresponds to the following test:
 *   Match any of the following 3 alternatives:
 *
 *  1) dot, then optional second dot, then / or nothing    i.e.  .  ./  ..  ../        OR
 *  2) /                                                   i.e.  /                     OR
 *  3) (A-Za-z colon - [optional]), then / or \            i.e. optional drive letter + colon, then / or \
 *
 * Basically, the three choices mean "explicitly relative or absolute path, on either
 * Unix/Linux or Windows"
 */

var ABSOLUTE_OR_RELATIVE_PATH_REGEX = /^(?:\.\.?(?:\/|$)|\/|([A-Za-z]:)?[\/\\])/;

/*
 * Resolve the real path for a file. Return null if does not
 * exist or is not a file or FIFO, return the real path otherwise.
 * 
 * Cache the result in the passed-in cache for performance, 
 * keyed on the filePath passed in.
 *
 * NOTE: Because this is a private method, it does not attempt to normalize
 * the path passed in - it assumes the caller has done that.
 * 
 * @private
 * @method _getRealFilePath
 * @param {Cache} realFilePathCache the Cache object to cache the real (resolved) 
 * path in, keyed by filePath. See lib/cache.js and lib/cache-group.js
 * @param {String} filePath the path to the file of interest (which must have
 * been normalized, but not necessarily resolved to a real path).
 * @return {String} real path or null
 */
function _getRealFilePath(realFilePathCache, filePath) {
  if (realFilePathCache.has(filePath)) {
    return realFilePathCache.get(filePath);  // could be null
  }

  var realPath = null;  // null = 'FILE NOT FOUND'

  try {
    var stat = fs.statSync(filePath);

    // I don't know if Node would handle having the filePath actually
    // be a FIFO, but as the following is also part of the node-resolution
    // algorithm in resolve.sync(), we'll do the same check here.
    if (stat.isFile() || stat.isFIFO()) {
      realPath = fs.realpathSync(filePath);
    }
  } catch (e) {
    if (e === null || typeof e !== 'object' || e.code !== 'ENOENT') {
      throw e;
    }
  }

  realFilePathCache.set(filePath, realPath);

  return realPath;
}


/*
 * Resolve the real path for a directory, return null if does not
 * exist or is not a directory, return the real path otherwise.
 *
 * @param {Cache} realDirectoryPathCache the Cache object to cache the real (resolved) 
 * path in, keyed by directoryPath. See lib/cache.js and lib/cache-group.js
 * @param {String} directoryPath the path to the directory of interest (which must have
 * been normalized, but not necessarily resolved to a real path).
 * @return {String} real path or null
 */
function _getRealDirectoryPath(realDirectoryPathCache, directoryPath) {
  if (realDirectoryPathCache.has(directoryPath)) {
    return realDirectoryPathCache.get(directoryPath);  // could be null
  }

  var realPath = null;

  try {
    var stat = fs.statSync(directoryPath);

    if (stat.isDirectory()) {
      realPath = fs.realpathSync(directoryPath);
    }
  } catch (e) {
    if (e === null || typeof e !== 'object' || (e.code !== 'ENOENT' && e.code !== 'ENOTDIR')) {
      throw e;
    }
  }

  realDirectoryPathCache.set(directoryPath, realPath);

  return realPath;
}


/*
 * Given a package 'name' and starting directory, resolve to a real (existing) file path.
 *
 * Do it similar to how it is done in resolve.sync() - travel up the directory hierarchy,
 * attaching 'node-modules' to each directory and seeing if the directory exists and
 * has the relevant 'package.json' file we're searching for. It is *much* faster than
 * resolve.sync(), because we don't test that the requested name is a directory.
 * This routine assumes that it is only called when we don't already have
 * the cached entry.
 * 
 * NOTE: it is valid for 'name' to be an absolute or relative path. 
 * Because this is an internal routine, we'll require that 'dir' be non-empty
 * if this is called, to make things simpler (see resolvePackagePath).
 *
 * @param realFilePathCache the cache containing the real paths corresponding to
 *   various file and directory paths (which may or may not be already resolved). 
 *
 * @param name the 'name' of the module, i.e. x in require(x), but with
 *   '/package.json' on the end. It is NOT referring to a directory (so we don't 
 *   have to do the directory checks that resolve.sync does).
 *   NOTE: because this is an internal routine, for speed it does not check 
 *   that '/package.json' is actually the end of the name.
 *
 * @param dir the directory (MUST BE non-empty, and valid) to start from, appending the name to the
 *   directory and checking that the file exists. Go up the directory hierarchy from there.
 *   if name is itself an absolute path, 
 *
 * @result the path to the actual package.json file that's found, or null if not.
 */
function _findPackagePath(realFilePathCache, name, dir) {

  var fsRoot = pathRoot(dir);

  var currPath = dir;

  while (currPath !== fsRoot) {
    // when testing for 'node_modules', need to allow names like NODE_MODULES,
    // which can occur with case-insensitive OSes.
    var endsWithNodeModules = path.basename(currPath).toLowerCase() === 'node_modules';

    var filePath = path.join(currPath, (endsWithNodeModules ? '' : 'node_modules'), name);

    var realPath = _getRealFilePath(realFilePathCache, filePath);

    if (realPath) {
      return realPath;
    }

    if (endsWithNodeModules) {
      // go up past the ending node_modules directory so the next dirname
      // goes up past that (if ending in node_modules, going up just one
      // directory below will then add 'node_modules' on the next loop and
      // re-process this same node_modules directory.
      currPath = path.dirname(currPath);
    }

    currPath = path.dirname(currPath);
  }

  return null;
}

/*
 * Resolve the path to a module's package.json file, if it exists. The
 * name and dir are as in hashForDep and ModuleEntry.locate.
 *   
 *  @param caches an instance of CacheGroup where information will be cached
 *  during processing.
 * 
 *  @param name the 'name' of the module.  The name may also be a path, 
 *  either relative or absolute. The path must be to a module DIRECTORY, NOT to the
 *  package.json file in the directory, as we attach 'package.json' here.
 * 
 *  @param dir (optional) the root directory to run the path resolution from.
 *  if dir is not provided, __dirname for this module is used instead.
 *  
 *  @return the realPath corresponding to the module's package.json file, or null
 *  if that file is not found or is not a file.
 * 
 * Note: 'name' is expected in the format expected for require(x), i.e., it is
 * resolved using the Node path-normalization rules.
 */
module.exports = function resolvePackagePath(caches, name, dir) {
  if (typeof name !== 'string' || name.length === 0) {
    throw new TypeError('resolvePackagePath: \'name\' must be a non-zero-length string.');
  }

  // Perform tests similar to those in resolve.sync(). 
  var basedir = dir || __dirname;

  // Ensure that basedir is an absolute path at this point.
  var absoluteStart = path.resolve(basedir);

  // convert absoluteStart to a real path (follow links, etc).
  absoluteStart = _getRealDirectoryPath(caches.REAL_DIRECTORY_PATH, absoluteStart);

  if (!absoluteStart) {
    throw new TypeError('resolvePackagePath: \'dir\' must refer to a valid directory name.');
  }

  if (ABSOLUTE_OR_RELATIVE_PATH_REGEX.test(name)) {
    // path.resolve() is smart enough that given both absoluteStart and name
    // if name is itself an absolute path (either Linux or Windows) it will
    // return that (normalized), ignoring absolutePath. If name is a relative
    // path, it will be combined with absolutePath and the result normalized.
    var res = path.resolve(absoluteStart, name);
    if (name = '..' || name.slice(-1) === '/') {
      res += '/';  // (path.resolve strips trailing /, add back)
    }
    return _getRealFilePath(caches.REAL_FILE_PATH, path.join(res, 'package.json'));

    // XXX Do we need to handle the core(x) case too? Not sure.

  } else {
    return _findPackagePath(caches.REAL_FILE_PATH, path.join(name, 'package.json'), absoluteStart); 
  }
};

// exposed for testing only
module.exports._findPackagePath = _findPackagePath;
module.exports._getRealFilePath = _getRealFilePath;
module.exports._getRealDirectoryPath = _getRealDirectoryPath;
