const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var ClientSchema = new mongoose.Schema(
	 {
	email:{
		type: String,
		required: true,
		minlength: 1,
		trim: true,
		unique: true,
		validate:{
			validator: validator.isEmail,
			message: '{value} is not valid'
		}
	},
	password:{
		type: String,
		required: true,
		minlength: 6
	},
	tokens: [{
		access: {
			type: String,
			required: true
		},
		token: {
			type: String,
			required: true
		}
	}]
}
);

ClientSchema.methods.toJSON = function(){
	var client = this;
	var clientObject = client.toObject();

	return _.pick(clientObject, ['_id','email']);
};

ClientSchema.methods.generateAuthToken = function (){
	var client = this;
	var access = 'auth';
	var token = jwt.sign({_id: client._id.toHexString(), access},'abc123').toString();

	 client.tokens = client.tokens.concat([{access,token}]);
	// client.tokens.push({access,token});

	return client.save().then(() => {

		return token;
	});
};

ClientSchema.methods.removeToken = function(token){
	var client = this;

	return client.update({
		$pull:{
			tokens: {token}
		}

	});
};


ClientSchema.statics.findByToken = function(token){
	var Client = this;
	var decoded;

	try{
		decoded = jwt.verify(token, 'abc123');
	} catch(e){
		return Promise.reject();
	}

	return Client.findOne({
		_id: decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	})
};

ClientSchema.statics.findByCredentials = function(email, password){
	var Client = this;

	return Client.findOne({email}).then((client) => {
		if(!client){
			return Promise.reject();
		}

		return new Promise((resolve, reject) =>{
			bcrypt.compare(password, client.password, (err, result) => {
				if(result){
					resolve(client);
				}else{
					reject();
				}
			});
		});

	});
};


ClientSchema.pre('save', function(next) {
	var client = this;

	if(client.isModified('password')){
		var password = client.password;

		bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(password, salt, (err,hash) => {
		client.password = hash;
		next();
	});
});



	}else{
		next();
	}
});

var Client = mongoose.model('Client', ClientSchema);

module.exports = {Client}; 