var OT = require('../lib/ot');
var Instance = require('../lib/instance');
var expect =require('chai').expect;
var redis = require('redis');
var async = require('async');

describe('test features', function() {
  before(function() {
    this.ot = OT.createClient();
  });

  it('should return correct result', function(done) {
    var _this = this;
    async.each(features, function(item, callback) {
      var id = Math.random() * 1000000 | 0;
      _this.ot.init(id, function(err, instance) {
        var UUID = instance.UUID;
        instance.batch(item.base, function() {
          var server = _this.ot.instance(UUID, item.server.version);
          server.batch(item.server.changes, function() {
            var client = _this.ot.instance(UUID, item.client.version);
            client.batch(item.client.changes, function(version) {
              expect(client.transformedChanges).to.eql(item.expect.server);
              var otherInstance = _this.ot.instance(UUID, version - item.client.changes.length);
              otherInstance.fetchChanges(function() {
                expect(otherInstance.changes).to.eql(item.expect.client);
                callback();
              });
            });
          });
        });
      });
    }, done);
  });
});

var features = [
  {
    base: [
      { type: 'add', line: 0, content: 'c' },     // c
      { type: 'add', line: 0, content: 'b' },     // bc
      { type: 'add', line: 0, content: 'a' },     // abc
    ],
    server: {
      version: 3,
      changes: [
        { type: 'del', line: 0 },                 // bc
        { type: 'del', line: 0 },                 // c
        { type: 'del', line: 0 },                 //
      ]
    },
    client: {
      version: 3,
      changes: [
        { type: 'add', line: 0, content: '0' },   // 0abc
        { type: 'add', line: 2, content: '2' },   // 0a2bc
        { type: 'add', line: 4, content: '4' },   // 0a2b4c
      ]
    },
    expect: {
      client: [
        { type: 'add', line: 0, content: '0' },   // 0
        { type: 'add', line: 1, content: '2' },   // 02
        { type: 'add', line: 2, content: '4' },   // 024
      ],
      server: [
        { type: 'del', line: 1 },                 // 02b4c
        { type: 'del', line: 2 },                 // 024c
        { type: 'del', line: 3 },                 // 024
      ]
    }
  }
];
