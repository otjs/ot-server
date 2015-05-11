var key = require('./key');
var redisLock = require('redis-lock');
var transform = require('otjs');

function Instance(UUID, version, redis) {
  this.UUID = UUID;
  this.version = version;
  this.redis = redis;
  this.lock = redisLock(redis);
  this.key = key.UUID(this.UUID, 'changes');
}

Instance.prototype.fetchChanges = function(callback) {
  var _this = this;
  this.redis.lrange(this.key, this.version, -1, function(err, changes) {
    _this.changes = changes && changes.map(function(change) {
      return JSON.parse(change);
    });
    callback(err);
  });
};

Instance.prototype.batch = function(changes, callback) {
  var _this = this;
  this.lock(key.UUID(this.UUID, 'lock'), function(done) {
    _this.fetchChanges(function(err) {
      if (err) {
        done();
        return callback(err);
      }
      var transformed = transform.transformBatch(_this.changes, changes);
      _this.transformedChanges = transformed[0];
      changes = transformed[1].map(function(change) {
        if (change === null) {
          return JSON.stringify(null);
        }
        return JSON.stringify({
          type: change.type,
          line: change.line,
          text: change.text
        });
      });
      changes.unshift(_this.key);
      changes.push(function(err, version) {
        done();
        _this.version = version;
        callback(err, version);
      });
      if (changes.length === 2) {
        _this.redis.llen.apply(_this.redis, changes);
      } else {
        _this.redis.rpush.apply(_this.redis, changes);
      }
    });
  });
};

Instance.prototype.add = function(line, text, callback) {
  this.batch([{
    type: 'add',
    line: line,
    text: text
  }], callback);
};

Instance.prototype.del = function(line, callback) {
  this.batch([{
    type: 'del',
    line: line
  }], callback);
};

module.exports = Instance;
