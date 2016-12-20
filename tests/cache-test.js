'use strict';

var expect = require('chai').expect;
var Cache = require('../lib/cache');

describe('Cache', function() {
  it('instantiates', function() {
    expect(new Cache()).to.be.ok;
  });

  var cache;
  beforeEach(function() {
    cache = new Cache();
  });

  describe('.set .get', function() {
    it('get (no set)', function() {
      expect(cache.get('foo')).to.eql(undefined);
    });

    it('set (no get)', function() {
      expect(cache.set('foo', 1)).to.eql(1);
    });

    it('get set get set get', function() {
      expect(cache.get('foo')).to.eql(undefined);
      expect(cache.set('foo', 1)).to.eql(1);
      expect(cache.get('foo')).to.eql(1);
      expect(cache.set('foo', 2)).to.eql(2);
      expect(cache.get('foo')).to.eql(2);
    });
  });

  describe('.has', function() {
    it('has no set', function() {
      expect(cache.has('foo')).to.eql(false);
    });

   it('has post  set', function() {
      expect(cache.set('foo', 1)).to.eql(1);
      expect(cache.has('foo')).to.eql(true);

      expect(cache.set('foo', false)).to.eql(false);
      expect(cache.has('foo')).to.eql(true);

      expect(cache.set('foo', undefined)).to.eql(undefined);
      expect(cache.has('foo')).to.eql(true);

      expect(cache.delete('foo')).to.eql(undefined);
      expect(cache.has('foo')).to.eql(false);
    });
  });

  describe('.delete', function() {
    it('delete no set', function() {
      expect(cache.has('foo')).to.eql(false);
      expect(cache.delete('foo')).to.eql(undefined);
      expect(cache.has('foo')).to.eql(false);
    });

    it('delete post set', function() {
      expect(cache.set('foo', 1)).to.eql(1);
      expect(cache.has('foo')).to.eql(true);
      expect(cache.delete('foo')).to.eql(undefined);
      expect(cache.has('foo')).to.eql(false);
    });
  });

  describe('.size', function() {
    it('is 0 when empty', function() {
      expect(cache.size).to.eql(0);
    });

    it('is 1 when added to', function() {
      expect(cache.size).to.eql(0);
      cache.set('fo', 1);
      expect(cache.size).to.eql(1);
    });


    it('handles deletes', function() {
      expect(cache.size).to.eql(0);
      cache.set('fo', 1);
      expect(cache.size).to.eql(1);
      cache.delete('fo');
      expect(cache.size).to.eql(0);
    });
  });
});
