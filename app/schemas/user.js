var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var SALT_STRNGTH = 10;
var UserSchema = new mongoose.Schema({
	name:{
		type: String,
		unique:true
	},
	avatar: {
		type:String,
		default:'/avatar/default.png',
	},
	//0-5 normal user
	//6-10 user admin
	//11-15 movie admin & user admin
	//20以上 super admin
	role: {
		type:Number,
		default:0
	},
	password: String,
	meta: {
    createdAt: {
        type: Date,
        default: Date.now()
    },
    updateAt: {
        type: Date,
        default: Date.now()
    }
	}
});

UserSchema.pre('save', function(next){
	var user = this;
	if (this.isNew) {
		this.meta.createdAt = this.meta.updateAt = Date.now();
	} else {
		this.meta.updateAt = Date.now();
	}

	//随机salt及密码加密
	bcrypt.genSalt(SALT_STRNGTH, function(err, salt){
		if (err) return next(err);
		
		bcrypt.hash(user.password, salt, null, function(err, hash) {
			if (err) return next(err);
			user.password = hash;
			next();
		});
	});
	
});

//实例方法
UserSchema.methods = {
	comparePass: function(pass, cb) {
		bcrypt.compare(pass, this.password, function(err, isMatch) {
			if (err) {
				return cb(err);
			}
			cb(null, isMatch);
		});
	}
};

//静态方法
UserSchema.statics = {
	fetch : function(cb) {
		return this
		.find({})
		.sort('meta.updateAt')
		.exec(cb);
	},
	findById: function(id, cb){	
		return this.findOne({_id:id}).exec(cb);
	}
};

module.exports = UserSchema;