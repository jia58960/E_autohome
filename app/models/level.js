var mongoose = require('mongoose');
var LevelSchema = require('../schemas/level');
var Level = mongoose.model('Level', LevelSchema);
module.exports = Level;