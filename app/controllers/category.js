var mongoose = require('mongoose');
var Brand = require('../models/brand');
var Category = require('../models/category');
//var Category = require('../models/category');

exports.list = function(req, res) {
  var url = res.query.url;
	/*Category.fetch(function(err, categories) {
    if (err) {
      console.log(err);
    }
    res.render('categorylist', {
      title: '电影分类列表',
      categories: categories
    });
  });*/
  res.send(url);
};