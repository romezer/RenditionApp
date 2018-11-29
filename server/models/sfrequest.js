const mongoose = require('mongoose');
const validator = require('validator');
const request = require('request');
const fs = require('fs');
var jsforce = require('jsforce');

var SFrequestSchema = mongoose.Schema({
	recordid:{
	 		type: String,
			required: true,
			minlength: 1,
			trim: true,
	 	},
	 contentversionid:{
	 		type: String,
			required: true,
			minlength: 1,
			trim: true,
	 	},
	 filename:{
	 		type: String,
			required: true,
			minlength: 1,
			trim: true,
	 	},
	 	url:{
	 		type: String,
			required: true,
			minlength: 1,
			trim: true,
	 	},
	
	 token:{
	 	type: String
	 }

});


SFrequestSchema.methods.salesforceAuth = function (username, password, contentversionid, url){
	var sfrequest = this;
	var options = {
	  method: 'POST',
  	  url: 'https://dot-compliance-dev-ed.my.salesforce.com/services/oauth2/token',
	  headers: {
	    'Content-Type': 'application/x-www-form-urlencoded'
	  },
	  body: 'grant_type=password&client_id=3MVG9Rd3qC6oMalXPfki0tQwzVHNAVqvkGidyaNe.pkqOdtzoTG50X.00UNW0yt28TFvxvY7ScCptnYXpzNfR&client_secret=9103621269174995043&username=' + username + '&password=' + password 
};
 
function callback(error, response, body) {
	 
	 	 if (!error && response.statusCode == 200) {

		    var info = JSON.parse(body);
		    sfrequest.token = info.access_token;
		    var token = info.access_token;
		   return sfrequest.save().then(() => {
		   		sfrequest.getFileWithSessionId(token, contentversionid, url).then((err) =>{
		   			if(err){
		   				console.log(err);
		   			}
		   			console.log('Saved!!!');
		   		});
		   });
	
		  }else{
		  	console.log('Error!',error);
		  	console.log('status ',response.statusCode);
		  }
}
request(options, callback);
};



SFrequestSchema.methods.getFileWithToken = (token, contentversionid, url) => {
	return new Promise((resolve, reject) => {
		 var conn = new jsforce.Connection({
	  instanceUrl : url,
	  accessToken : token
	});
		conn.query(`SELECT Id,Title,FileExtension, VersionData FROM ContentVersion WHERE Id = '${contentversionid}' LIMIT 1`  , function(err, res){
	 	if(err){console.log(err);return reject(err)}
		 	var fileOut  = fs.createWriteStream('uploads/' + res.records[0].Title + '.' + res.records[0].FileExtension);
		 	conn.sobject('ContentVersion').record(res.records[0].Id).blob('VersionData').pipe(fileOut);
		 	resolve();
	 	});
	});
};

SFrequestSchema.methods.getFileWithSessionId = (token, contentversionid, url) => {
	return new Promise((resolve, reject) => {
		 var conn = new jsforce.Connection({
	  serverUrl  : url,
	  sessionId  : token
	});
		conn.query(`SELECT Id,Title,FileExtension, VersionData FROM ContentVersion WHERE Id = '${contentversionid}' LIMIT 1`  , function(err, res){
	 	if(err){console.log(err);return reject(err)}
		 	var fileOut  = fs.createWriteStream('uploads/' + res.records[0].Title + '.' + res.records[0].FileExtension);
		 	conn.sobject('ContentVersion').record(res.records[0].Id).blob('VersionData').pipe(fileOut);
		 	resolve();
	 	});
	});
};



var SFrequest = mongoose.model('SFrequest', SFrequestSchema);

module.exports = {SFrequest};