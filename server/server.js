var express = require('express');
var bodyParser = require('body-parser');
const _ = require('lodash');

var {mongoose} = require('./db/mongoose');
var {Client} = require('./models/client');
var {authenticate} = require('./middleware/authenticate');

var app = express();

app.use(bodyParser.json());

app.post('/clients', (req,res) => {
	var client = new Client({
		email: req.body.email,
		password: req.body.password
	});

	client.save().then(() => {
		return client.generateAuthToken();
}).then((token) =>{
	console.log('token',token);
	res.header('x-auth',token).send(client);
}).catch((e) => {
		console.log('Error',e);
		res.status(400).send(e);
	})
});

app.post('/clients/login', (req, res) => {
	var body = _.pick(req.body, ['email','password']);

	Client.findByCredentials(body.email, body.password).then((client) => {
		return client.generateAuthToken().then((token) =>{
			res.header('x-auth',token).send(client);
		});
	}).catch((e) => {
		console.log(e);
		res.status(400).send();
	});
});


app.get('/clients/me', authenticate,  (req,res) => {
	res.send(req.client);
});

app.delete('/clients/me/token', authenticate, (req, res) => {
	req.client.removeToken(req.token).then(() =>{
		res.status(200).send();
	}, () => {
		res.status(400).send();
	});
});


app.listen(3000, ()=> {
	console.log('Started on port 3000');
});