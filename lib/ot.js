var redis = require('redis');
var uuid = require('node-uuid');
var Instance = require('./instance');
var key = require('./key');

function OT(options) {
  if (options) {
    // https://github.com/mranney/node_redis/pull/665
    this.redis = redis.createClient.apply(redis, arguments);
  } else {
    this.redis = redis.createClient();
  }
}

OT.createClient = function(options) {
  return new OT(options);
};

OT.prototype.init = function(id, callback) {
  var _this = this;
  this.redis.get(key.id(id, 'UUID'), function(err, UUID) {
    if (err) {
      return callback(err);
    }
    if (UUID) {
      return callback(null, new Instance(UUID, 0, _this.redis));
    } else {
      UUID = uuid.v4();
      _this.redis.set(key.id(id, 'UUID'), UUID, function() {
        if (err) {
          return callback(err);
        }
        callback(null, new Instance(UUID, 0, _this.redis));
      });
    }
  });
};

OT.prototype.instance = function(UUID, version) {
  return new Instance(UUID, version, this.redis);
};

module.exports = OT;
