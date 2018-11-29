const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

 const multer  = require('multer');
 const storage = multer.diskStorage({
 	destination: function(req, file, cb){
 		cb(null, 'uploads/');
 	},
 	filename: function(req, file, cb){
 		cb(null, file.originalname);
 	}
 });
 const upload = multer({ storage: storage});
// var gridfs = require('gridfs-stream');
// var fs = require('fs');

var {mongoose} = require('./db/mongoose');
var {Client} = require('./models/client');
var {authenticate} = require('./middleware/authenticate');
var {Document} = require('./models/document');
var {SFrequest} = require('./models/sfrequest');

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



app.post('/upload',authenticate, upload.single('file'), function (req, res, next) {
	res.status(200).send();
	
});

app.post('/docs/upload',authenticate, upload.array('docs', 4), function (req, res, next) {
	var contentdoc = req.files[0].path;
	var header = req.files[1].path;
	var footer = req.files[2].path;
	var signaturepage = req.files[3].path;

	var document = new Document({
		documentstate: req.body.documentstate,
		documentid: req.body.documentid,
		documents: [{ contentdoc,header,footer,signaturepage}]
	});

	document.save().then(() => {
		res.status(200).send(document);
	});
});


app.post('/sfrquest', (req, res) => {
	var sfrequest = new SFrequest({
		recordid: req.body.recordid,
		contentversionid: req.body.contentversionid,
		filename: req.body.filename
	});

	sfrequest.save().then(() => {
		//res.status(200).send(sfrequest);
		//sfrequest.getcontentversion(token,  req.body.contentversionid);
		return sfrequest.salesforceAuth(req.body.usernamne, req.body.password, req.body.contentversionid,  req.body.filename);
		
	}).then(() => {
		res.status(200).send(sfrequest);
		// console.log('salesforce token: ',token);
		// res.header('sf-auth',token).send(sfrequest);
		// //sfrequest.getcontentversion('00D24000000H3ci!ARAAQB.ydHkfQZ0Jttm6lu3GFJdhNI_W7dZXFTBIufU9KtqP9wCWNRLHXTOCfSxgZrZ.HntRkX4ayCbUD5B9gOQmRMlzdHxR',  req.body.contentversionid);
	}).catch((e) => {
		console.log('Error',e);
		res.status(400).send(e);
	});
});




app.listen(3000, ()=> {
	console.log('Started on port 3000');
});