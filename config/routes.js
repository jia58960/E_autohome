var Index = require('../app/controllers/index');
var Level = require('../app/controllers/level');
var Category = require('../app/controllers/category');
/*var Movie = require('../app/controllers/movie');
var Comment = require('../app/controllers/comment');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var Category = require('../app/controllers/category');
var User = require('../app/controllers/user');*/

module.exports = function(app) {

  /*app.use(function(req, res, next) {
  	var _user = req.session.user;
    app.locals.user = _user;
	  next();
  });*/
  
  //index page
  app.get('/', Index.index);
  app.get('/fetch', Index.fetch); //查询series中的数据并一一获取车型详细数据
  app.get('/detail', Index.detail); //展示某款车的详细信息
  app.get('/list', Index.list); //显示列表
  app.get('/level/list', Level.list);
  app.get('/level/all', Level.all);

  app.post('/index/carlist', Index.carlist);
  app.post('/index/catelist', Index.catelist);
  //app.post('/category/list', Category.list);
  //Movie Controller
  /*app.get('/admin/movie/new', User.signinRequired, User.movieAdminRequired, Movie.new);
  app.post('/admin/movie',multipartMiddleware, User.signinRequired, User.movieAdminRequired, Movie.savePoster, Movie.save);
  app.get('/admin/update/:id', User.signinRequired, User.movieAdminRequired, Movie.update);
  app.get('/admin/movie/list', User.signinRequired, User.movieAdminRequired, Movie.list);
  app.delete('/admin/movie/list', User.signinRequired, User.movieAdminRequired,  Movie.del);
  app.get('/movie/:id', Movie.detail);

  //User Controller
  app.post('/user/signup', multipartMiddleware,User.saveAvatar, User.signup); //注册
  app.post('/user/login', User.login);
  app.get('/signin', User.showSignin);
  app.get('/signup', User.showSignup);
  app.get('/logout', User.logout);
  app.get('/admin/user/list', User.signinRequired, User.userAdminRequired, User.list);
  app.delete('/admin/user/list', User.signinRequired, User.userAdminRequired,  User.del);

  //Comment Controller
  app.post('/user/comment', User.signinRequired, Comment.save);

  //Category controller
  app.get('/admin/category/new', User.signinRequired, User.movieAdminRequired, Category.new);
  app.post('/admin/category', User.signinRequired, User.movieAdminRequired, Category.save);
  app.delete('/admin/category/list', User.signinRequired, User.movieAdminRequired, Category.del);
  app.get('/admin/category/list', User.signinRequired, User.movieAdminRequired,  Category.list);

  //Serch
  app.get('/results', Index.search);*/
};
