var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BrandSchema = new Schema({
	name: String,
	logo:String,
	cates:{type:Schema.Types.ObjectId, ref:"Category"},
	//category: [{type:Schema.Types.ObjectId, ref:"Category"}],
	meta: {
		createAt: {
			type: Date,
			default: Date.now()
		},
		updateAt: {
			type: Date,
			default: Date.now()
		}
	}
});

BrandSchema.statics = {
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

BrandSchema.pre('save', function(next){
	if (this.isNew) {
		this.meta.createAt = this.meta.updateAt = Date.now();
	} else {
		this.meta.updateAt = Date.now();
	}
	next();
});
module.exports = BrandSchema;