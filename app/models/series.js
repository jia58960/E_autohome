var mongoose = require('mongoose');
var SeriesSchema = require('../schemas/series');
var Series = mongoose.model('Series', SeriesSchema);
module.exports = Series;