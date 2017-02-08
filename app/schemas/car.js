var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var CarSchema = new Schema({
	name:{
		type:String,
		index: { unique: true }
	}, //车名
	score:String, //用户评分
	attention:String, //关注度
	guide:String, //指导价
	posters:[Schema.Types.Mixed], //图片
	features:String, //特征（英文逗号隔开）
	scoredetail:Schema.Types.Mixed, //评分详细
	fuel:{ //平均油耗
		type:String,
		default:''
	},
	series:{
		type:Schema.Types.ObjectId,
		ref:'Series'
	},
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

CarSchema.pre('save', function(next){
	if (this.isNew) {
		this.meta.createdAt = this.meta.updateAt = Date.now();
	} else {
		this.meta.updateAt = Date.now();
	}
	next();
});

//静态方法
CarSchema.statics = {
	findById: function(id, cb){	
		return this.findOne({_id:id}).exec(cb);
	}
};

module.exports = CarSchema;