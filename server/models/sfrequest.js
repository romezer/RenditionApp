const mongoose = require('mongoose');
const validator = require('validator');
const request = require('request');
const fs = require('fs');
var jsforce = require('jsforce');
var querystring = require("querystring");


var assert = require('assert');
const { WordsApi, PostDocumentSaveAsRequest, SaveOptionsData } = require("asposewordscloud");
var StorageApi = require('asposestoragecloud');
var  PdfApi  = require("asposepdfcloud");
var config = {'appSid':'34613236-43e7-433a-b6d4-c8180930be7b','apiKey':'b233bab04dd42804b609510ad3f067aa' , 'debug' : true};

var storageApi = new StorageApi(config);
var  pdfApi = new PdfApi(config);
var pagesObj = [];
var Set = require('Set');
var sizeSet = new Set();



var SFrequestSchema = mongoose.Schema({
	recordId:{
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
	 recordType:{
	 		type: String,
	 		trim: true,
	 },
	 documentState:{
	 		type: String,
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


SFrequestSchema.methods.salesforceAuth = function (username, password, contentversionid, url, filename, fileextension, documentState, recordId, recordType){
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

		   		sfrequest.getFileWithSessionId(token, contentversionid, url, filename, fileextension).then((message) =>{
		   				console.log('Success ', message);
		   				sfrequest.getSignaturePage(token, recordId, recordType, documentState, '500;560', filename).then((message) =>{
		   						console.log('Success ', message);
		   						sfrequest.uploadFileToAspose('34613236-43e7-433a-b6d4-c8180930be7b','b233bab04dd42804b609510ad3f067aa','uploads/', filename, fileextension).then((message) =>{
		   								console.log('Success ', message);
		   							 	sfrequest.convetWordToPdf('34613236-43e7-433a-b6d4-c8180930be7b','b233bab04dd42804b609510ad3f067aa', filename, fileextension).then((message) => {
		   							 		console.log('Success ', message);
		   									sfrequest.uploadFileToAspose('34613236-43e7-433a-b6d4-c8180930be7b','b233bab04dd42804b609510ad3f067aa','uploads/', filename + '_sign' , 'pdf').then((message) => {
		   										console.log('Success ', message);
		   										sfrequest.mergeFiles(filename + '_merge.pdf', filename + '.pdf', filename + '_sign.pdf','uploads/').then((message) =>{
		   											console.log('Success merging', message);
		   											sfrequest.getTotalPages(filename + '_merge.pdf').then((message) => {
		   												console.log('Success get total number of pages ', message);
		   												var totalPages = message;
		   												sfrequest.addWaterMarkText(filename + '_merge.pdf', totalPages, documentState).then((message) => {
		   													console.log('Success ', message);
		   													sfrequest.getPageInfo(filename + '_merge.pdf', totalPages).then((message) => {
		   														console.log('Success ', message);
		   														// sfrequest.getTemplate(token, recordId, recordType, documentState, '500;560', url).then((message)=>{

		   														// },(error) => {

		   														// });


		   														sfrequest.getAllTemplates(sizeSet, token, recordId, recordType, documentState, url).then((message)=> {
		   															console.log('Success getAllTemplates ', message);
		   														},(error)=> {
		   															console.log('Error getAllTemplates ', error );
		   														});
		   													}, (error) => {
		   														console.log('get page Info Error: ' , error);
		   													});
		   												}, (error) =>{
		   													console.log('Error put water mark text', error);
		   												});
		   											}, (error) => {
		   												console.log('Get total number of pages error');
		   											});
		   										}, (error) =>{
		   											console.log('mergeFiles error ',error);
		   										});
		   										
		   									}, (error) => {
		   										console.log('uploadFileToAspose error ', error);
		   									});

		   							 }, (error) => {
		   							 	console.log('convetWordToPdf error ', error);
		   							 });
		   							

		   						}, (error) => {
		   							console.log('uploadFileToAspose error ', error);
		   						});
		   					

		   				}, (error) => {
		   					console.log('getSignaturePage error ',error);
		   				});

		   	
		   		}, (error) => {
		   			console.log('getFileWithSessionId error ',error);
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
	 	if(err){
	 		return reject(err);
	 	}
	 		if(res.records.length === 0){
	 			// console.log('File not found');
	 			return reject('File not found');
	 		}
		 	var fileOut  = fs.createWriteStream('uploads/' + filename + '.' + fileextension);
		 	conn.sobject('ContentVersion').record(res.records[0].Id).blob('VersionData').pipe(fileOut);
		 	resolve('File saved');
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
    		resolve('Signature page saved');
		 }else{
		 	// console.log('Error: ', error);
		 	// console.log('response.statusCode: ', response.statusCode);
		 	return reject(error);
		 }
	}
	request(options, callback);
	});

}

SFrequestSchema.methods.getTemplate = (token, objid, recordType, documentState, pageSize, uri) =>{
	return new Promise((resolve, reject) => {
		console.log('getTemplate start');
		var options = {
		  method: 'GET',
	  	  url: `${uri}/services/apexrest/CompSuite/getTemplate?recordType=${recordType}&objid=${objid}
	  	  &pageSize=${pageSize}&documentState=${documentState}`,
		  headers: {
		    'Content-Type': 'application/json',
		    'Authorization': 'Bearer ' + token,
		    'Access-Control-Allow-Origin': '*'
		  }
		};

		function callback(error, response, body) {
			 if (!error && response.statusCode == 200) {
			 	fs.writeFileSync('uploads/' + pageSize + '.pdf', body,'base64');
    			resolve('Template page saved');
			 }else{
			 	return reject(error);
			 }
		}
		request(options, callback);
	});
}

SFrequestSchema.methods.getAllTemplates = (sizeSet, token, objid, recordType, documentState, uri) => {
	return new Promise((resolve, reject) => {
		console.log('getAllTemplates start');
		console.log('getAllTemplates sizeSet: ' + JSON.stringify(sizeSet));
		for(var i = 0 ; i < sizeSet.size() ; i ++){
			console.log('getAllTemplates iterate: ' + i);
			sfrequest.getTemplate(token, objid, recordType, documentState, sizeSet[i], uri).then((message) => {
			revolve('Template ' + i + 'Saved');
			}, (error) => {
				return reject(error);
			});
		}

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
		// console.log(result.body.code);   
		resolve('File converted to pdf'); 
		}).catch(function(err) {
			return reject(err);
	});
});
}

SFrequestSchema.methods.uploadFileToAspose = (appSid, appKey, outFolder, filename, fileextension) =>{
		return new Promise((resolve, reject) => {


		var AppSID = appSid;
		var AppKey = appKey;
		var outFolder = outFolder;
		
		var name = filename + '.' + fileextension;
		try {	
			
			storageApi.PutCreate(name, versionId=null, storage=null, file= 'uploads/' + name , function(responseMessage) {
				// console.log('responseMessage:', responseMessage);
				// console.log('status:', responseMessage.status);
				if(responseMessage.code === 401){
					var err = 'Upload error';
						return reject(err);
				}
				resolve('File uploaded to aspose');
			});  

		}catch (e) {
		  // console.log("exception in example");
		  // console.log(e);
		  return reject(e);
		}
	

		});
		
}


SFrequestSchema.methods.downloadFile = (appSid, appKey, outFolder, filename, fileextension) => {
	return new Promise((resolve, reject) => {


		var AppSID = appSid;
		var AppKey = appKey;
		var outFolder = outFolder;
		var config = {'appSid':AppSID,'apiKey':AppKey , 'debug' : true};

		// Instantiate Aspose Storage API SDK
	//	var storageApi = new StorageApi(config);
		var name = filename + '.' + fileextension;
		try {	 
			storageApi.GetDownload(name, versionId=null, storage=null, function(responseMessage) {
					console.log('status:', responseMessage.status);
					var writeStream = fs.createWriteStream('uploads/' + name);
					writeStream.write(responseMessage.body);
					resolve('File downloaded');
				}); 

		}catch (e) {
		  console.log("exception in example");
		  console.log(e);
		  return reject(e);
		}


	});
	

}

SFrequestSchema.methods.mergeFiles = (name, mergefilename1, mergefilename2, data_path) => {
		return new Promise((resolve, reject) => {
		
		var newName = name;
		var merge1 = mergefilename1;
		var merge2 = mergefilename2;
		//console.log('name: ' + name + ' ; ' + 'mergefilename1: ', mergefilename1 ' ; ' + 'mergefilename2: ' , mergefilename2);
		var mergeDocumentsBody = {
				'List' : [merge1, merge2]
		};
		console.log('name: ' , newName);

		try {
						// pdfApi.PutMergeDocuments(name, null, null, mergeDocumentsBody);
						// 	resolve('Files merged');

						pdfApi.PutMergeDocuments(newName, null, null, mergeDocumentsBody, function(responseMessage){
							console.log('responseMessage: ' + JSON.stringify(responseMessage));
							resolve('Files merged');
						});

		}
		catch (e) 
		{
		 // console.log('catch error ',e);
		  return reject(e);
		}
		
			
	});
	
}

SFrequestSchema.methods.getTotalPages = (name) => {
	return new Promise((resolve, reject) => {
		try{
			pdfApi.GetPages(name, null, null, function(responseMessage) {
				console.log(JSON.stringify(responseMessage));
				var pages = responseMessage.body.Pages.List.length;
				resolve(pages);
			});
		}catch(e){
			return reject(e);
		}
		
	});
}

SFrequestSchema.methods.addWaterMarkText = (name, totalPages, documentSatet) => {
	return new Promise((resolve, reject) => {
		console.log('totalPages: ' + totalPages);
		var stampBody = {
		'Value' : documentSatet,
		'Background' : false,
		'Type' : 'Text',
		"RotateAngle": 45,
		"TextAlignment": 2,
		"VerticalAlignment": 2,
		"HorizontalAlignment": 2,
		"Zoom": 1.5,
		"Opacity": 0.2,
	    "TextState": {
		    "FontSize": 50,
		    "ForegroundColor": {
		      "A": 0,
		      "R": 255,
		      "G": 0,
		      "B": 0
		    }
		  },
			};
		try{
			for(var i = 1 ; i <= totalPages ; i ++){
			console.log('Iteration: ' + i);
			pdfApi.PutPageAddStamp(name, i, null, null, stampBody, function(responseMessage) {
				// console.log('Water mark text status: ' + JSON.stringify(responseMessage));
			});
		}
			resolve('Water mark text added');
		}catch(e){
			return reject(e);
		}
		

	});
}

SFrequestSchema.methods.getPageInfo = (name, totalPages) => {
	return new Promise((resolve, reject) => {
		console.log('getPageInfo totalPages: ' + totalPages);
		try{
			for(var j = 1 ; j <= totalPages ; j ++){
				pdfApi.GetPage(name, j, null, null, function(responseMessage) {
				//console.log(j + ' Page status:' + ' Width:' + responseMessage.body.Page.Rectangle.Width + ' Height: ' + responseMessage.body.Page.Rectangle.Height);	
				var temp = { page: responseMessage.body.Page.Id,
				 			 Width: responseMessage.body.Page.Rectangle.Width,
				 			 Height: responseMessage.body.Page.Rectangle.Height};
				// console.log('temp: ' + JSON.stringify(temp));
				pagesObj.push(temp);
				var sizes = responseMessage.body.Page.Rectangle.Width +';' + responseMessage.body.Page.Rectangle.Height;
				sizeSet.add(sizes);
				// console.log('pagesObj: ' + JSON.stringify(pagesObj));
				// console.log('sizeSet: ' + JSON.stringify(sizeSet));
				});	
				if(totalPages == pagesObj.length){

				}
			}
			resolve('Page Info done');
			
			
		}catch(e){
			return reject(e);
		}
	});
}



SFrequestSchema.methods.diskUsage = () => {
	var AppSID = '34613236-43e7-433a-b6d4-c8180930be7b';
	var AppKey = 'b233bab04dd42804b609510ad3f067aa';
	 
	var config = {'appSid':AppSID,'apiKey':AppKey};
	 
	//Instantiate Aspose.Storage API SDK
	// var storageApi = new StorageApi(config);
	 
	//invoke Aspose.Storage Cloud SDK API to get Disc Usage
	storageApi.GetDiscUsage('', function(responseMessage) {
	    console.log('status:', responseMessage.status);
	    console.log('body:', responseMessage.body);
	    console.log('DiscUsage:', responseMessage.body.DiscUsage.UsedSize);	
	});
}


var SFrequest = mongoose.model('SFrequest', SFrequestSchema);

module.exports = {SFrequest};