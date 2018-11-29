const mongoose = require('mongoose');
const validator = require('validator');
const request = require('request');
const fs = require('fs');
var base64 = require('base-64');
var utf8 = require('utf8');
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
	
	 token:{
	 	type: String
	 }

});


SFrequestSchema.methods.salesforceAuth = function (username, password, contentversionid, filename){
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
		   		// return token;
		   		sfrequest.getFile(token, contentversionid, 'https://dot-compliance-dev-ed.my.salesforce.com').then(() =>{
		   			console.log('Saved!!!');
		   		});
		   	//	sfrequest.getcontentversion(token, contentversionid, filename);
		   });
		    
		    
		  }else{
		  	console.log('Error!',error);
		  	console.log('status ',response.statusCode);
		  }


	
 
}
request(options, callback);
};


SFrequestSchema.methods.getcontentversion = function (token, contentversionid, filename){
	var sfrequest = this;
	var options = {
	  method: 'GET',
  	  url: 'https://dot-compliance-dev-ed.my.salesforce.com/services/data/v40.0/sobjects/ContentVersion/' + contentversionid + '/VersionData',
	  headers: {
	    'Authorization': 'Bearer ' + token,
	    'Access-Control-Allow-Origin':'*'
	  } 
};

function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
  	// var fileOut  = fs.createWriteStream('uploads/' + filename);
  	 var buf = new Buffer(body, 'binary').toString('base64');
  	//	var buf = new Buffer(body,'base64');
  	// var bytes = body.split('%');
  	// var b = new Buffer(bytes.length);
  	// var c = '';
  	// for(var i = 0 ; i < bytes.length ; i ++){
  	// 	c = c + bytes[i];
  	// }
  	// console.log(c);
  	fs.writeFile('uploads/' + filename, buf, function(err){
  		if(err){console.log(err);}
  		console.log('Saved!');
  	});
 

  }else{
  	console.log('Error!',error);
  	console.log('status ',response.statusCode);
  }
}
request(options, callback);


};

SFrequestSchema.methods.getFile = (token, contentversionid, url) => {
	// var conn = new jsforce.Connection();
 // 	conn.login('rom@dotdev.com', 'Comp20196WRRlMR31mhebC8c4rwKOjqr', function(err, res){
 // 	if(err){console.log(err);}
 // 	conn.query(`SELECT Id,Title,FileExtension, VersionData FROM ContentVersion WHERE Id = '${contentversionid}' LIMIT 1`  , function(err, res){
 // 	if(err){console.log(err);}
 // 	console.log(res);
 // 	console.log(res.records[0].Title + '.' + res.records[0].FileExtension);
	//  	var fileOut  = fs.createWriteStream('uploads/' + res.records[0].Title + '.' + res.records[0].FileExtension);
	//  	conn.sobject('ContentVersion').record(res.records[0].Id).blob('VersionData').pipe(fileOut);
 // 	});
 // });

 var conn = new jsforce.Connection({
  instanceUrl : url,
  accessToken : token
});
	conn.query(`SELECT Id,Title,FileExtension, VersionData FROM ContentVersion WHERE Id = '${contentversionid}' LIMIT 1`  , function(err, res){
 	if(err){console.log(err);}
	 	var fileOut  = fs.createWriteStream('uploads/' + res.records[0].Title + '.' + res.records[0].FileExtension);
	 	conn.sobject('ContentVersion').record(res.records[0].Id).blob('VersionData').pipe(fileOut);
 	});
};



var SFrequest = mongoose.model('SFrequest', SFrequestSchema);

module.exports = {SFrequest};