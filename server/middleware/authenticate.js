var {Client} = require('./../models/client');

var authenticate = (req, res, next) => {
var token = req.header('x-auth');

	Client.findByToken(token).then((client) => {
		if(!client){
			return Promise.reject();
		}

		req.client = client;
		req.token = token;
		next();
	}).catch((e) => {
		res.status(401).send();
	});
};

module.exports = {authenticate};