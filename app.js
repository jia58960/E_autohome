var express = require('express');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var morgan = require('morgan'); // HTTP request logger middleware for node.js
var path = require('path');
var log4js = require('log4js');

var Promise = require('bluebird');
var mongoose = require('mongoose');
mongoose.Promise = Promise;
var mongoStore = require('connect-mongo')(session);
var port = process.env.PORT || 3000;
var app = express();
var fs = require('fs');
var dbUrl = 'mongodb://localhost:27017/autohome';
var compression = require('compression');

mongoose.connect(dbUrl); //连接数据库

//配置log4js
var log = log4js.getLogger("app");
log4js.configure('./config/log4js.json');
var logger = log4js.getLogger("app");
app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));

/// catch 404 and forward to error handler
/*app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
      log.error("Something went wrong:", err);
      res.status(err.status || 500);
      res.render('error', {
          message: err.message,
          error: err
      });
  });
}*/

app.set('views', './app/views/pages');
app.set('view engine', 'jade');
app.use(cookieParser());
app.use(session({
  secret: 'ethan',
  /*cookie:{
  	maxAge: 1000 * 60 * 60 * 24 * 1, //默认1天
  	domain:'/'
  },*/
  store: new mongoStore({
    url: dbUrl,
    collection: 'sessions'
  }),
  resave: false,
  saveUninitialized: true
}));
app.use(compression()); //启用gzip压缩
app.use(express.static(path.join(__dirname, 'public')));
app.use(require('body-parser').urlencoded({ extended: true }));
app.locals.moment = require('moment');
app.listen(port);

/*if ('development' === app.get('env')) {
  app.set('showStackError', true);
  app.use(morgan(':method :url :status'));
  app.locals.pretty = true;
  //mongoose.set('debug', true);
}*/
//引入路由
require('./config/routes')(app);
console.log('server is listening port' + port + '!');