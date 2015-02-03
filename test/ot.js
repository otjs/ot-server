var OT = require('../lib/ot');
var Instance = require('../lib/instance');
var expect =require('chai').expect;

describe('OT', function() {
  describe('.createClient()', function() {
    it('should create a instance', function() {
      var ot = OT.createClient();
      expect(ot).to.be.instanceof(OT);
    });

    it('should pass the arguments to node-redis', function() {
      var ot = OT.createClient({ port: 6380 });
      expect(ot.redis.options).to.have.property('port', 6380);
    });
  });

  describe('#init', function() {
    before(function(done) {
      this.ot = OT.createClient();
      var _this = this;
      this.ot.init(1, function(err, instance) {
        _this.instance = instance;
        done();
      });
    });

    it('should create a new instance', function(done) {
      this.ot.init(12, function(err, instance) {
        expect(instance).to.be.instanceof(Instance);
        expect(instance).to.have.property('UUID');
        done();
      });
    });

    it('should reuse the existed instance', function(done) {
      var _this = this;
      this.ot.init(1, function(err, instance) {
        expect(instance.UUID).to.eql(_this.instance.UUID);
        done();
      });
    });

    it('should generate a different UUID with different id', function(done) {
      var _this = this;
      this.ot.init(2, function(err, instance) {
        expect(instance.UUID).to.not.eql(_this.instance.UUID);
        done();
      });
    });
  });

  describe('#instance', function() {
    before(function() {
      this.ot = OT.createClient();
    });

    it('should return an instance', function() {
      var instance = this.ot.instance('123', 8);
      expect(instance).to.be.instanceof(Instance);
      expect(instance).to.have.property('UUID', '123');
      expect(instance).to.have.property('version', 8);
    });
  });
});
