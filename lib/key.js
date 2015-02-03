exports.id = function(id, property) {
  return 'ot.id:' + id + ':' + property;
};

exports.UUID = function(UUID, property) {
  return 'ot.uid:' + UUID + ':' + property;
};
