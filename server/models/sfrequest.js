const mongoose = require('mongoose');
const validator = require('validator');
const request = require('request');
const fs = require('fs');
var jsforce = require('jsforce');
var querystring = require("querystring");

const { WordsApi, PostDocumentSaveAsRequest, SaveOptionsData } = require("asposewordscloud");
var StorageApi = require('asposestoragecloud');


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
	 fileExtension:{
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


SFrequestSchema.methods.salesforceAuth = function (username, password, contentversionid, url, filename, fileextension){
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

		   		sfrequest.getFileWithSessionId(token, contentversionid, url, filename, fileextension).then((err) =>{
		   			if(err){
		   				console.log(err);
		   			}else{
		   				console.log('File Saved');
		   				sfrequest.getSignaturePage(token,'a0H1o00000PNzq9EAD', 'Simple', 'Effective', '500;560', filename).then((error) =>{
		   					if(error){
		   						console.log('getSignaturePage Error ',error);
		   					}else{

		   						console.log('Signature page pdf saved');
		   						//TODO - aspose api
		   						//sfrequest.diskUsage();
		   						
								

		   						sfrequest.uploadFileToAspose('34613236-43e7-433a-b6d4-c8180930be7b','b233bab04dd42804b609510ad3f067aa','uploads/', filename, fileextension).then((err) =>{
		   							if(err){
		   								console.log(err);
		   							}else{
		   								console.log('File uploaded');
		   							 	sfrequest.convetWordToPdf('34613236-43e7-433a-b6d4-c8180930be7b','b233bab04dd42804b609510ad3f067aa', filename, fileextension).then((err) => {
		   							 	if(err){
		   							 		console.log(err);
		   							 	}else{
		   							 		console.log('File converted to PDF');
		   							 		// upload signature page

		   							 		sfrequest.uploadFileToAspose('34613236-43e7-433a-b6d4-c8180930be7b','b233bab04dd42804b609510ad3f067aa','uploads/', filename + '_sign' , 'pdf').then((err) =>{
											if(err){
												console.log('$$$ Error $$$',err);
											}
											});
		   							 	}
		   							 	

		   							 	
		   							 });
		   							}
		   							
		   							
		   						});
		   						
		   							
		   						


		   					}


		   				});
		   			
		   			}
		   			
		   			
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

SFrequestSchema.methods.getFileWithSessionId = (token, contentversionid, url, filename, fileextension) => {

	return new Promise((resolve, reject) => {
		 var conn = new jsforce.Connection({
	  serverUrl  : url,
	  sessionId  : token
	});
		conn.query(`SELECT Id,Title,FileExtension, VersionData FROM ContentVersion WHERE Id = '${contentversionid}' LIMIT 1`  , function(err, res){
	 	if(err){console.log(err);
	 		return reject(err);
	 	}
	 		if(res.records.length === 0){
	 			console.log('File not found');
	 		}
		 	var fileOut  = fs.createWriteStream('uploads/' + filename + '.' + fileextension);
		 	conn.sobject('ContentVersion').record(res.records[0].Id).blob('VersionData').pipe(fileOut);

		 	resolve();
	 	});
	});
};


SFrequestSchema.methods.getSignaturePage = (token, objid, recordType, documentState, pageSize, filename) => {
	return new Promise((resolve, reject) => {
		var options = {
	  method: 'GET',
  	  url: `https://dot-compliance-dev-ed.my.salesforce.com/services/apexrest/CompSuite/getSignaturePage?recordType=${recordType}&objid=${objid}
  	  &pageSize=${pageSize}&documentState=${documentState}`,
	  headers: {
	    'Content-Type': 'application/json',
	    'Authorization': 'Bearer ' + token,
	    'Access-Control-Allow-Origin': '*'
	  }
	};

	function callback(error, response, body) {
		 if (!error && response.statusCode == 200) {

    		fs.writeFileSync('uploads/' + filename + '_sign' + '.pdf', body,'base64');
    		resolve();
		 }else{
		 	console.log('Error: ', error);
		 	console.log('response.statusCode: ', response.statusCode);
		 	return reject(error);
		 }
	}
	request(options, callback);
	});

}

SFrequestSchema.methods.convetWordToPdf = (appSid, appKey, filename, fileextension) => {
	return new Promise((resolve, reject) => {
	wordsApi = new WordsApi(appSid, appKey);
	var request = new PostDocumentSaveAsRequest({
	name: filename + '.' + fileextension,
	saveOptionsData: new SaveOptionsData(
		{
		saveFormat: "pdf",
		fileName: filename + '.pdf'
		})
	});

	wordsApi.postDocumentSaveAs(request).then((result) => {    
		console.log(result.body.code);   
		resolve(); 
		}).catch(function(err) {
			// Deal with an error
			console.log('aspose error ',err);
			return reject(err);
	});
});
}

SFrequestSchema.methods.uploadFileToAspose = (appSid, appKey, outFolder, filename, fileextension) =>{
		return new Promise((resolve, reject) => {
		console.log('uploadFileToAspose');
		var AppSID = appSid;
		var AppKey = appKey;
		var outFolder = outFolder;
		var config = {'appSid':AppSID,'apiKey':AppKey , 'debug' : true};

		// Instantiate Aspose Storage API SDK
		var storageApi = new StorageApi(config);
		var name = filename + '.' + fileextension;
		try {	
			
			storageApi.PutCreate(name, versionId=null, storage=null, file= 'uploads/' + name , function(responseMessage) {
				console.log('responseMessage:', responseMessage);
				console.log('status:', responseMessage.status);
				if(responseMessage.code === 401){
					var err = 'Upload error';
						//return reject(err);
				}
				resolve();
			});  

		}catch (e) {
		  console.log("exception in example");
		  console.log(e);
		  return reject(e);
		}
	

		});
		
}





SFrequestSchema.methods.diskUsage = () => {
	var AppSID = '34613236-43e7-433a-b6d4-c8180930be7b';
	var AppKey = 'b233bab04dd42804b609510ad3f067aa';
	 
	var config = {'appSid':AppSID,'apiKey':AppKey};
	 
	//Instantiate Aspose.Storage API SDK
	var storageApi = new StorageApi(config);
	 
	//invoke Aspose.Storage Cloud SDK API to get Disc Usage
	storageApi.GetDiscUsage('', function(responseMessage) {
	    console.log('status:', responseMessage.status);
	    console.log('body:', responseMessage.body);
	    console.log('DiscUsage:', responseMessage.body.DiscUsage.UsedSize);	
	});
}


var SFrequest = mongoose.model('SFrequest', SFrequestSchema);

module.exports = {SFrequest};