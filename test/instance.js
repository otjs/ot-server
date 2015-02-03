var OT = require('../lib/ot');
var Instance = require('../lib/instance');
var expect =require('chai').expect;
var redis = require('redis');

describe('Instance', function() {
  before(function() {
    this.UUID = 'test.uuid';
    this.redis = redis.createClient();
  });

  beforeEach(function() {
    this.instance = new Instance(this.UUID, 0, this.redis);
  });

  describe('#add()', function() {
    it('should increase the version', function(done) {
      var _this = this;
      this.instance.add(2, 'new line', function(err, version) {
        _this.redis.llen(_this.instance.key, function(err, length) {
          expect(length).to.eql(version);
          done();
        });
      });
    });
  });

  describe('#del()', function() {
    it('should increase the version', function(done) {
      var _this = this;
      this.instance.del(2, function(err, version) {
        _this.redis.llen(_this.instance.key, function(err, length) {
          expect(length).to.eql(version);
          done();
        });
      });
    });
  });

  describe('#batch()', function() {
    it('should increase the version', function(done) {
      var _this = this;
      this.redis.llen(this.instance.key, function(err, oldLength) {
        _this.instance.batch([{
          type: 'add',
          line: 7,
          content: 'test'
        }, {
          type: 'add',
          line: 6,
          content: 'test'
        }, {
          type: 'del',
          line: 6
        }], function(err, version) {
          _this.redis.llen(_this.instance.key, function(err, length) {
            expect(length).to.eql(version);
            expect(length).to.eql(oldLength + 3);
            done();
          });
        });
      });
    });

    it('should transform line correctly', function(done) {
      var _this = this;
      var UUID = '123321';
      var instance = new Instance(UUID, 0, this.redis);
      _this.redis.del(instance.key, function() {
        var actions = [{
          type: 'add',
          line: 7,
          content: '7'
        }, {
          type: 'add',
          line: 6,
          content: '6'
        }, {
          type: 'del',
          line: 8
        }];
        instance.batch(actions, function(err, version) {
          var otherInstance = new Instance(UUID, 0, _this.redis);
          otherInstance.batch([{
            type: 'add',
            line: 5,
            content: '5'
          }, {
            type: 'del',
            line: 4
          }], function() {
            expect(otherInstance.transformedChanges).to.have.length(actions.length);
            done();
          });
        });
      });
    });
  });

  describe('#fetchChanges()', function() {
    it('should return the changes', function(done) {
      var _this = this;
      var UUID = '123321';
      var instance = new Instance(UUID, 0, this.redis);
      instance.batch([{
        type: 'add',
        line: 7,
        content: 'test'
      }, {
        type: 'add',
        line: 6,
        content: 'test'
      }, {
        type: 'del',
        line: 6
      }], function() {
        _this.redis.llen(instance.key, function(err, length) {
          var otherInstance = new Instance(UUID, length - 2, _this.redis);
          otherInstance.fetchChanges(function(err) {
            expect(otherInstance.changes).to.have.length(2);
            done();
          });
        });
      });
    });
  });
});
