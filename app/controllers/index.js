var Level = require('../models/level');
var Series = require('../models/series');
var Car = require('../models/car');
var Brand = require('../models/brand');
var Category = require('../models/category');
var log = require('log4js').getLogger('index');
var http = require('http');
var fs = require('fs');
var Promise = require('bluebird');
var iconv = require('iconv-lite');
var cheerio = require('cheerio');
var url = require('url');
var request = require('request');

var carsAsyncArr = [];
var carsImgPath = './public/upload/cars/';
var carsPageSuc = 0;
var carsPageFail = 0;
var subPageSuc = 0;
var subPageFail = 0;

//异步保存cars信息
function saveCarsAsync(data) {
	return new Promise(function(resolve, reject) {
		var carObj = new Car(data);
		carObj.save(function(err, car){
			if (err) {
				log.error('save car error:'+err);
				reject(err);
			} else {
				resolve(car);
			}
		});
	});
}

//异步下载图片
function downloadImgAsync(url, name,path) {
    return new Promise(function(resolve, reject) {
        //var startTime = new Date().getTime();
        request(url)
        .on('response', function() {
            //var endTime = new Date().getTime();
            //console.log('Downloading...%s..., 耗时: %ss', name, (endTime - startTime) / 1000);
        })
        .on('error', function(err) {
            reject(err);
            //console.log(err);
            log.error(url+"图片下载失败！"+err);
            console.log(url+"图片下载失败！"+err);
        })
        .pipe(fs.createWriteStream(path + name))
        .on('finish', function(){
            resolve();
        });
    });
}

//抓取口碑和图片链接
var getPage2Async = function(getUrl, id) {
  return new Promise(function(resolve, reject) {
    http.get(getUrl, function(res) {
      var html = '';
      res.setEncoding('binary');
      res.on('data', function(data) {
        html += data;
      }).on('end', function() {
        var buf = new Buffer(html, 'binary');
        var str = iconv.decode(buf, 'GBK'); //将GBK编码的字符转换成utf8的  
        subPageSuc++;
        resolve({str, id});
      });
    }).on('error', function(err) {
      reject(getUrl);
      log.error('口碑或图片链接'+getUrl+'下载失败！原因：'+err);
      subPageFail++;
      //console.log(getUrl+'爬取失败!');
    });
  });
};

//异步抓取页面
var getPageAsync = function(getUrl, id) {
  return new Promise(function(resolve, reject) {
    http.get(getUrl, function(res) {
      var html = '';
      res.setEncoding('binary'); //or hex  
      res.on('data', function(data) { //加载数据,一般会执行多次  
        html += data;
      }).on('end', function() {
        var buf = new Buffer(html, 'binary'); //这一步不可省略  
        var str = iconv.decode(buf, 'GBK'); //将GBK编码的字符转换成utf8的  
        carsPageSuc++;
        resolve({str, id});
      });
    }).on('error', function(err) {
    	console.log(err);
      carsPageFail++;
      log.error('系列链接'+getUrl+'抓取失败!原因'+err);
      reject(getUrl);
    });
  });
};
//index page
module.exports.index = function(req, res) {
	var query = Level.find().exec().then(function(doc) {
		res.render('index', {
        title: '汽车数据分析系统',
        initdata: doc
      });
	},function(err){
		console.log(err);
	});
};


//1、分析主页面 获取图片和口碑链接并异步获取页面
var analysisPage = function(page, id) {
	var $ = cheerio.load(page);
	var seriesName = $('.tab-title').find('a').text().trim();
	var carsArea = $('.interval01-list');
	var carsCount = 0;
	carsArea.each(function(k,v) {
		var carsList = $(v).find('li');
		carsList.each(function(k2, v2){
			
			carsCount++;
			var carNameArea = $(v2).find('.interval01-list-cars');
			var carName = seriesName + '('+carNameArea.find('a').text()+')';
			var featureList = carNameArea.find('p:not(:first-child)');
			var featureArr = [];
			featureList.each(function(k3, v3) {
				var value = $(v3).text().trim();
				if (value){
					featureArr.push(value);
				}
			});
			var carAttention = $(v2).find('.interval01-list-attention').find('span').css('width');
			var carGuidePrice = $(v2).find('.interval01-list-guidance').text().trim();
			var relatedArea = $(v2).find('.interval01-list-related'); //口碑链接
			var parameterUrl = relatedArea.find('a').eq(0).attr('href');//图片链接
			var imgUrl = relatedArea.find('a').eq(1).attr('href');

			Promise.all([getPage2Async(parameterUrl,id),getPage2Async(imgUrl, id)])
				.then(pages => {
				analysisOther(pages,{
					name:carName,
					attention:carAttention,
					guide:carGuidePrice,
					features:featureArr.join(','),
					series:id
				});
			}, url => {
				console.log('获取失败的口碑或图片链接'+url);
			});
		});
	});
	console.log('【'+seriesName+'】系列下的车辆数目：'+carsCount);
};
//2、分析口碑以及图片两个子页面，下载完图片后再分析组装图片数据
var analysisOther = function(pages,data) {
	var infoPage  = pages[0];
	var imgPage = pages[1];
	var objId = infoPage.id;
	var $ = cheerio.load(infoPage.str); //详情
	var _ = cheerio.load(imgPage.str); //图片
	var scoreArea = $('.list-ul').find('li').eq(1).text();
	var fuelArea = $('.list-ul').find('li').eq(2).find('.font-number');
	var userScore = scoreArea.replace(/\s/g,'');
	var fuel =fuelArea && fuelArea.length?fuelArea.text():'--';
	var detailScoreArea = $('.date-ul');
	var detailScoreArr = [];

	detailScoreArea.each(function(key, val) {
		var list = $(val).find('.border-r-solid');
		list.each(function(key1,val1) {
			var type = $(val1).children('.width-01').text().trim();
			var score = $(val1).children('.width-02').text().trim();
			detailScoreArr.push({type:type,score:score});
		});
	});
	data.scoredetail = detailScoreArr;
	data.fuel = fuel;
	data.score = userScore;
	//debugger;
	var carName = _('.cartab-title-name').children('a').text();
	var carsPath = carsImgPath + carName;
	if (fs.existsSync(carsPath)) {
	  //console.log('有目录了');
  } else {
    fs.mkdirSync(carsPath);
  }

	var imgArea = _('.carpic-list03');
	var imgArr = [];
	imgArea.each(function(k,v){
		var imgList = _(v).find('li:not(.last)');
		imgList.each(function(k1,v1) {
			var imgPath = _(v1).find('img').attr('src').replace('t_','u_');
			
			var fileName = imgPath.split('/').pop();
			imgArr.push({
				imgPath:imgPath,
				fileName:fileName,
				carsPath:carsPath+'/'
			});
		});
	});

	//悠着点下载图片。。
	Promise.map(imgArr, function(item){
				return downloadImgAsync(item.imgPath, item.fileName, item.carsPath); 
			},{concurrency: 10}).then(function(args){
    analysisImgUrl(_,carsPath,data);
  }, function(err){
      console.log(err);
  });
};
//3、分析图片并组装好data
var analysisImgUrl = function(_, path, data) {
	var imgArea = _('.carpic-list03');
	var imgObj = [];
	imgArea.each(function(k,v){
		var imgArr = [];
		var imgList = _(v).find('li:not(.last)');
		var imgTitle = _(v).prev().children('a').eq(0).text();
		imgList.each(function(k1,v1) {
			var imgPath = _(v1).find('img').attr('src').replace('t_','u_');
			var fileName = imgPath.split('/').pop();
      imgArr.push(path.replace('./public','')+'/'+fileName);
		});
		imgObj.push({
			title:imgTitle,
			imgs:imgArr
		});
	});
	data.posters = imgObj;
	
	carsAsyncArr.push(saveCarsAsync(data));
	Promise.all(carsAsyncArr).then(function(cars){
		console.log('完成咯！');
	});
};

//获取每款车详细数据（抓取）
module.exports.fetch = function(req, res) {
	//已获取20161028的所有汽车数据
	//return false;
	/*Car.remove({}, function(err){
    if (err) {
      console.log(err);
    } else {
      log.debug('清空所有car数据成功！');
    }
  });*/
	var urls = [];
	//因为图片数据量巨大，这里采取分页处理
	/*var query = Series.find({}).limit(60).skip(0).exec(); //每次查询60条数据处理，skip下次为60*次数
	query.then(function(series) {
      series.forEach(function(v,k) {
      	var link = v.carslink;
      	var _id = v._id;
      	if (link){
      		urls.push({link:link,id:_id});	
      	}
      });
      console.log('有链接数量'+urls.length);

      Promise.map(urls, function(item){
				return getPageAsync(item.link, item.id); 
			},{concurrency: 5})
			.then(pages => {
					//console.log('系列页抓取失败数：' + carsPageFail);

			    pages.forEach(function(page) {
		        analysisPage(page.str, page.id);
		    	});
		    	console.log('nice!');
			}, url => {
				Series.update({carslink:url}, {$set:{notget:1}}, false, true, function(err, series) {
					if (err) {
						console.log(err);
						log.debug(url+'标记失败！');
					} else {
						log.debug('标记成功！');
					}
				});
			}).then(function(){
				console.log('finished');
			});
			
    }, function(err){
    	console.log(err);
    });*/
};

//汽车列表
module.exports.carlist = function(req, res) {
	var carid = req.body.carid;
	//console.log('车ID'+cid);
	var car = Car.find({series:carid}).exec();
	car.then(function(cars){
		console.log(cars);
		if (car) {
			res.status(200).json({success:1,data:cars});
		}
	},function(err) {
		res.status(500).json({success:0,msg:err});
	});
};
//展示某款车的详细信息
module.exports.detail = function(req, res) {
	var cid = req.query.cid;
	var car = Car.findOne({_id:cid}).exec();
	car.then(function(car){
		console.log(car);
		if (car) {
			res.render('detail.jade',{
				title:car.name,
				car:car
			});
		}
	},function(err) {
		console.log(err);
	});
};
var in_array = function(str,arr) {
  // 遍历是否在数组中 
  for (var i = 0, k = arr.length; i < k; i++) {
    if (str == arr[i]) {
      return true;
    }
  }
  return false;
};

//展示所有列表(级联显示)
module.exports.list = function(req, res) {
	var brandsArr = [];
	var newBrands = [];
	var pushCates = function(name, cate) {
		newBrands.forEach(function(item, key) {
			if ( item.brand === name) {
				item.cates.push(cate);
			}
		});
	};
	var brandQuery = Brand.find({})
	.populate('cates','name').exec();
		brandQuery.then(function(brands){
		// console.log('第一层菜单');
		// console.log(brands);
		//debugger;
		brands.forEach(function(item,key) {
			var name = item.name;
      var cates = item.cates;
      var logo = item.logo;
      if (in_array(name,brandsArr)) {
        pushCates(name,cates)
      } else {
        brandsArr.push(name);
        newBrands.push({
          brand: name,
          logo:logo,
          cates: [cates]
        });
      }
		});
		console.log('列表内容：');
		console.log(newBrands);
		res.render('list.jade',{
			title:'汽车品牌汇总列表',
			brands:newBrands
		});
	},function(err) {
		console.log(err);
	});
};

module.exports.catelist = function(req, res) {
	var cid = req.body.cate_id;
	/*res.status(500).json({success:1},{data:'nice'});
	return;*/
	//console.log(cid);
	if (cid) {
		Category.findOne({_id:cid})
		.populate(['series'])
		.exec(function(err, cates){
			if (err) {
				res.status(500).json({success:0,msg:err});
			} else {
				//console.log(cates);
				if (cates) {
					res.status(200).json({success:1,data:cates.series});
				} else {
					res.status(200).json({success:1,data:null});
				}
			}
		});

		/*cateQeury.then(,function(err) {
			res.status(500).json({success:0},{msg:err});
		});*/
	}
};