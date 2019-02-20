'use strict';
var path = require('path');
var assert = require('assert');
var depsFor = require('../lib/deps-for');

var fixturesPath = path.join(__dirname, 'fixtures');

function findIndex(arr, cb) {
  var foundIndex = -1;
  
  for (var index = 0; index < arr.length; index++) {
    if (cb(arr[index])) {
      foundIndex = index;
      break;
    }
  }
  
  return foundIndex;  
}

describe('depsFor', function() {
  it('Constructs a set of all dependencies recursively', function() {
    var expectedDeps = [{
      name: 'foo',
      version: '1.0.0',
      main: 'index.js',
      dependencies: {
        bar: '1.0.0',
        dedupped: '1.0.0',
        missing: '1.0.0'
      },
      baseDir: path.join(fixturesPath, '/node_modules/foo/')
    }, {
      name: 'bar',
      version: '1.0.0',
      main: 'index.js',
      baseDir: path.join(fixturesPath, '/node_modules/foo/node_modules/bar/')
    }, {
      name: 'dedupped',
      version: '1.0.0',
      main: 'index.js',
      dependencies: {
        'dedupped-child': '1.0.0'
      },
      baseDir: path.join(fixturesPath, '/node_modules/dedupped/')
    }, {
      name: 'dedupped-child',
      version: '1.0.0',
      main: 'index.js',
      baseDir: path.join(fixturesPath, '/node_modules/dedupped/node_modules/dedupped-child/')
    }];

    assert.deepEqual(depsFor('foo', fixturesPath), expectedDeps);
  });

  it('Allows optionalDependencies to be included via an option', function() {
    var expectedDeps = [{
      name: 'optional',
      version: '1.0.0',
      main: 'index.js',
      dependencies: {
        bar: '1.0.0',
        dedupped: '1.0.0',
        missing: '1.0.0'
      },
      optionalDependencies: {
        'optional-foo': '1.0.0'
      },
      baseDir: path.join(fixturesPath, '/node_modules/optional/')
    }, {
      name: 'optional-foo',
      version: '1.0.0',
      main: 'index.js',
      optionalDependencies: {
        'optional-bar': '1.0.0'
      },
      baseDir: path.join(fixturesPath, '/node_modules/optional/node_modules/optional-foo/')
    }, {
      name: 'optional-bar',
      version: '1.0.0',
      main: 'index.js',
      baseDir: path.join(fixturesPath, '/node_modules/optional/node_modules/optional-bar/')
    }, {
      name: 'bar',
      version: '1.0.0',
      main: 'index.js',
      baseDir: path.join(fixturesPath, '/node_modules/optional/node_modules/bar/')
    }, {
      name: 'dedupped',
      version: '1.0.0',
      main: 'index.js',
      dependencies: {
        'dedupped-child': '1.0.0'
      },
      baseDir: path.join(fixturesPath, '/node_modules/dedupped/')
    }, {
      name: 'dedupped-child',
      version: '1.0.0',
      main: 'index.js',
      baseDir: path.join(fixturesPath, '/node_modules/dedupped/node_modules/dedupped-child/')
    }];

    assert.deepEqual(depsFor('optional', fixturesPath, { includeOptionalDeps: true }), expectedDeps);

    // remove "optional-foo" from the expectedDeps array
    expectedDeps.splice(findIndex(expectedDeps, function(dep) { return dep.name === 'optional-foo'; }), 1);
    expectedDeps.splice(findIndex(expectedDeps, function(dep) { return dep.name === 'optional-bar'; }), 1);

    assert.deepEqual(depsFor('optional', fixturesPath, { includeOptionalDeps: false }), expectedDeps);
  });
});
