var Level = require('../models/level');
var Brand = require('../models/brand');
var Category = require('../models/category');
var Series = require('../models/series');
var log = require('log4js').getLogger('levels');
var http = require('http');
var fs = require('fs');
var Promise = global.Promise;
var iconv = require('iconv-lite');
var cheerio = require('cheerio');
var url = require('url');
var request = require('request');

//get conditions
module.exports.list = function(req, res) {
  var getUrl = url.parse("http://www.autohome.com.cn/car/");
  var html = '';
  http.get(getUrl, function(res) {
    res.setEncoding('binary'); //or hex  
    res.on('data', function(data) { //加载数据,一般会执行多次  
      html += data;
    }).on('end', function() {
      var buf = new Buffer(html, 'binary'); //这一步不可省略  
      var str = iconv.decode(buf, 'GBK'); //将GBK编码的字符转换成utf8的  
      analysis(str);
    });
  }).on('error', function(err) {
    log.error("http get error:"+err);
  });

  var filterMap = [
    { name: '价格：', pos: 1 },
    { name: '排量：', pos: 2 },
    { name: '驱动：', pos: 3 },
    { name: '燃料：', pos: 7 },
    { name: '变速箱：', pos: 4 },
    { name: '国别：', pos: 8 },
    { name: '生产方式：', pos: 6 },
    { name: '结构：', pos: 5 },
    { name: '座位：', pos: 9 },
    { name: '按配置：', pos: 10 }
  ];

  var getPosition = function(str) {
    var position = 0;
    filterMap.forEach(function(v, k) {
      if (v.name === str) {
        position = v.pos;
      }
    });
    return position;
  };
  //核心部分
  var analysis = function(data) {
    var $ = cheerio.load(data);
    var cars = $('.caricon-list').eq(0).find('dd'); //类型
    var $paramBox = $('#param-box');

    var priceBox = $paramBox.find('dd').first();
    var len = $paramBox.children().length;
    var featureBox = $('#auto-grade-config');

    var filters = [];

    //var displacementArr = [];
    for (var i = 1; i < len - 1; i++) {
      var dd = $paramBox.find('dd').eq(i);
      dd.children().each(function(k, v) {
        var $self = $(v);
        var $list = $(v).find('li');
        var title = $self.children('span').text();
        var pos = getPosition(title); //处在url中位置

        if ($self.find('.others').length) { //含有其它
          var $othlist = $(v).find('li:not(.others)');
          var dataArr = [];
          if (title === '座位：') { //座位取值特殊
            $othlist.each(function(k, v) {
              var text = $(v).find('a').text();
              var val;
              if (text === '全部') {
                val = 0;
              } else if (text.indexOf('以上') > -1) {
                val = parseInt(text, 10) + 1;
              } else {
                val = parseInt(text, 10);
              }

              dataArr.push({
                name: text,
                value: val
              });

            });
          } else {
            $othlist.each(function(k, v) {
              var text = $(v).find('a').text();
              var val;
              if (text === '全部') { //
                val = '0';
              } else {
                val = k;
              }

              dataArr.push({
                name: text,
                value: val
              });

            });
          }

          filters.push({
            pos: pos,
            title: title,
            data: dataArr
          });
        } else if (title === '排量：') { //排量的取值特殊
          var displacementArr = [];

          $list.each(function(k1, v1) {
            var text = $(v1).find('a').text();
            var val;
            if (text === '全部') { //
              val = '0.0_0.0';
            } else {
              var tmpArr = text.split('-');
              if (tmpArr.length < 2) { //1.0 或 4.0
                if (parseInt(tmpArr[0], 10) === 1) {
                  val = '0.0_1.0';
                } else {
                  val = '4.0_0.0';
                }
              } else {
                var min = parseFloat(tmpArr[0]);
                var max = parseFloat(tmpArr[1]);
                val = min + '_' + max;
              }
            }
            displacementArr.push({
              name: text,
              value: val
            });
          });
          filters.push({
            pos: pos,
            title: title,
            data: displacementArr
          });
        } else {
          var dataArr = [];
          $list.each(function(k, v) {
            var text = $(v).find('a').text();
            var val;
            if (text === '全部') { //
              val = '0';
            } else {
              val = k;
            }

            dataArr.push({
              name: text,
              value: val
            });

          });

          filters.push({
            pos: pos,
            title: title,
            data: dataArr
          });
        }
      });
    }

    var level = [];
    cars.each(function(k, v) {
      var name = $(v).find('span').text();
      var val = $(v).find('a').attr('href').split('/')[1];
      level.push({
        name: name,
        value: val
      });
    });

    //处理价格
    var priceArr = [];
    var priceList = priceBox.find('.number');
    var priceName = priceBox.children('span').text();
    var lowPrice = parseInt(priceList.first().text(), 10);
    var highPrice = parseInt(priceList.last().text(), 10);

    priceList.each(function(k, v) {
      var name = $(v).text();
      var num = parseInt(name, 10);
      var val = (num === lowPrice || num === highPrice) ? 1 : num;
      priceArr.push({
        name: name,
        value: val
      });
    });
    var priceObj = {
      pos: getPosition(priceName),
      title: priceName,
      data: priceArr
    };
    //处理配置
    var featureArr = [];
    var featureName = $paramBox.find('dd').last().children('span').text();
    featureBox.find('li').each(function(k, v) {
      var text = $(v).find('label').text().trim();
      var val = $(v).find('input').val();
      featureArr.push({
        name: text,
        value: val
      });
    });

    var featureObj = {
      pos: getPosition(featureName),
      title: featureName,
      data: featureArr
    };

    Level.remove({}, function(err, docs) {
      if (err) {
        console.log(err);
      } else {
        console.log('清空数据成功！');
      }
    });

    var levelObj = new Level();

    levelObj.levels = level;
    levelObj.conditions = filters;
    levelObj.features = featureObj;
    levelObj.price = priceObj;

    levelObj.save(function(err, filter) {
      if (err) {
        console.log(err);
        res.json({ success: 0 });
      } else {
        res.json({ success: 1, data: { levels: level, conditions: filters } });
      }
    });
  };
};

//异步抓取页面
var getPageAsync = function(getUrl) {
  return new Promise(function(resolve, reject) {
    http.get(getUrl, function(res) {
      var html = '';
      res.setEncoding('binary'); //or hex  
      res.on('data', function(data) { //加载数据,一般会执行多次  
        html += data;
      }).on('end', function() {
        var buf = new Buffer(html, 'binary'); //这一步不可省略  
        var str = iconv.decode(buf, 'GBK'); //将GBK编码的字符转换成utf8的  
        resolve(str);
      });
    }).on('error', function(err) {
      reject(err);
      console.log(getUrl + '爬取失败');
    });
  });
};

//异步下载图片
function downloadImgAsync(url, name) {
  return new Promise(function(resolve, reject) {
    var startTime = new Date().getTime();
    request(url)
      .on('response', function() {
        var endTime = new Date().getTime();
        console.log('Downloading...%s..., 耗时: %ss', name, (endTime - startTime) / 1000);
      })
      .on('error', function(err) {
        reject(err);
        console.log(err);
        //console.log(url + '下载失败！');
      })
      .pipe(fs.createWriteStream('./public/upload/logo/' + name))
      .on('finish', function() {
        resolve();
      });
  });
}

//批量插入系列数据
var insertSeriesAsync = function(item) {
  return new Promise(function(resolve, reject) {
    var seriesObj = new Series(item);
    seriesObj.save(function(err, series) {
      if (err) {
        reject(err);
      } else {
        resolve(series._id);
      }
    });
  });
};

var inserCateAsync = function(item, ids) {
    return new Promise((resolve, reject) => {
      var categoryObj = new Category();
      categoryObj.name = item;
      categoryObj.series = ids;
      categoryObj.save(function(err, cate) {
        if (err) {
          reject(err);
        } else {
          var _id = cate._id;
          resolve(_id);
        }
      });
    });
  };
  //获取所有品牌及其下面的分类数据
module.exports.all = function(req, res) {

  //先清空数据
  Brand.remove({}, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('清空brand数据成功！');
    }
  });

  Category.remove({}, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('清空category数据成功！');
    }
  });

  Series.remove({}, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('清空series数据成功！');
    }
  });

  var pages = [];
  for(var i=0;i<26;i++){
    pages.push(getPageAsync('http://www.autohome.com.cn/grade/carhtml/'+String.fromCharCode(65+i)+'.html'));
  }
  //pages.push(getPageAsync('http://www.autohome.com.cn/grade/carhtml/N.html'));
  Promise.all(pages).then(function(pages) {
    pages.forEach(function(page) {
      analysisMain(page);
    });
  });

  var analysisMain = function(data) {
    if (data === '') {
      return false;
    }
    var $ = cheerio.load(data);
    var asyncImgArr = [];
    $('img').each(function(k, v) {
      var imgPath = $(v).attr('src').replace('/50/', '/100/'); //下载100像素的logo
      var fileName = imgPath.split('/').pop();
      asyncImgArr.push(downloadImgAsync(imgPath, fileName));
    });

    Promise.all(asyncImgArr).then(function(args) {
      analysisPage($); //图片下载完成后再分析页面
    }, function(err) {
      console.log(err);
    });
  };

  var analysisPage = function($) {
    $('dl').each(function(k, v) {
      var $self = $(v);
      //var categoryArr = [];
      var firstChild = $self.children('dt');
      var secondChild = $self.children('dd');
      var imgPath = firstChild.find('img').attr('src');
      var brand = firstChild.find('div a').text();
      var brandLogo = '/upload/logo/' + imgPath.split('/').pop();
      var categoryList = secondChild.find('.h3-tit');
      //var seriesList = secondChild.find('.rank-list-ul');
      //二级分类
      categoryList.each(function(k, v) {
        //categoryArr.push($(v).text());
        var categoryName = $(v).text();
        var seriesArr = [];
        var seriesPromiseArr = [];
        var list = $(v).next().find('li:not(.dashline)');
        list.each(function(k1, v1) {
          var grey = $(v1).children('h4').find('.greylink');
          var link = $(v1).find('.red');
          var refprice = link.text();
          var carslink = link.attr('href');
          seriesArr.push({
            name: $(v1).children('h4').text(),
            carslink: carslink ? carslink : '',
            reference: refprice ? refprice : '暂无指导价',
            hasinfo: refprice ? 1 : 0
          });
        });

        if (seriesArr.length) {
          seriesArr.forEach(function(item) {
            seriesPromiseArr.push(insertSeriesAsync(item));
          });
        }
        
        Promise.all(seriesPromiseArr).then(function(ids) {
          Promise.all([inserCateAsync(categoryName, ids)]).then(function(ids) {
            var brandObj = new Brand();
            brandObj.name = brand;
            brandObj.logo = brandLogo;
            brandObj.cates = ids;
            brandObj.save(function(err, brand) {
              if (err) {
                console.log(err);
              }
            });
          });
        }, function(err) {
          console.log(err);
        });
      });
    });
  };
};
