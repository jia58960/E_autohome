var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var SeriesSchema = new Schema({
	name:String,
	reference:String,
	hasinfo:Number,
	carslink:String,
	notget:{
		type:Number,
		default:0
	},
	category:{
		type:Schema.Types.ObjectId,
		ref:'Category'
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

SeriesSchema.pre('save', function(next){
	if (this.isNew) {
		this.meta.createdAt = this.meta.updateAt = Date.now();
	} else {
		this.meta.updateAt = Date.now();
	}
	next();
});

//静态方法
SeriesSchema.statics = {
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

module.exports = SeriesSchema;