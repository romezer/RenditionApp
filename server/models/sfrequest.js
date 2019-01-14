	const mongoose = require('mongoose');
	const validator = require('validator');
	const request = require('request');
	const fs = require('fs');
	var jsforce = require('jsforce');
	var querystring = require("querystring");
	var async = require("async");

	var assert = require('assert');
	const { WordsApi, PostDocumentSaveAsRequest, SaveOptionsData } = require("asposewordscloud");
	var StorageApi = require('asposestoragecloud');
	var  PdfApi  = require("asposepdfcloud");
	var config = {'appSid':'34613236-43e7-433a-b6d4-c8180930be7b','apiKey':'b233bab04dd42804b609510ad3f067aa' , 'debug' : true};

	var storageApi = new StorageApi(config);
	var  pdfApi = new PdfApi(config);
	var pagesObj = [];
	var templateArr= [];
	var pageIdToTeplateMap = [];
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
			   													sfrequest.getPageInfo(filename + '_merge.pdf', totalPages, filename).then((message) => {
			   														console.log('Success ', message);
			   														sfrequest.getAllTemplates(sizeSet, token, recordId, recordType, documentState, url, filename).then((message)=> {
			   															console.log('Success getAllTemplates ', message);
			   															sfrequest.uploadTemplates('34613236-43e7-433a-b6d4-c8180930be7b','b233bab04dd42804b609510ad3f067aa',templateArr).then((message) =>{
			   																console.log('Success upload teplates ', message);
			   																sfrequest.addTepmlatesStamp(filename, pageIdToTeplateMap.length , pageIdToTeplateMap).then((message) => {
			   																	console.log('Success: ' + message);

			   																	sfrequest.addPageNumberStemp(filename + '_merge.pdf',totalPages).then((message) =>{
			   																		console.log('Success: ' + message);
			   																		sfrequest.downloadFinalDoc(filename + '_merge.pdf').then((message) =>{
			   																		console.log('Success: ' + message);

			   																		sfrequest.insertContentVersion(token, url, filename, '.pdf').then((message) =>{
			   																			console.log('insertContentVersion Success: ' + message);
			   																			sfrequest.updateDocRevision(token, recordId, message, url).then((message) => {
			   																				console.log('updateDocRevision success: ' + message);
			   																			}, (error) =>{
			   																				console.log('updateDocRevision error: ' + error);
			   																			});
			   																		}, (error) => {
			   																			console.log('insertContentVersion error: ' + error)
			   																		})

				   																	}, (error) =>{
				   																		console.log('downloadFinalDoc Error: ' + error);
				   																	})
			   																	}, (error) => {
			   																		console.log('addPageNumberStemp error: ' + error);
			   																	})


			   																	
			   																}, (error) => {
			   																	console.log('addTepmlatesStamp error: ' + error);
			   																})
			   															}, (error) => {
			   																console.log('Error upload templates ', error);
			   															})
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

	SFrequestSchema.methods.insertContentVersion = (token, url, filename, fileextension) => {
		return new Promise((resolve, reject) => {
		  var conn = new jsforce.Connection({
		  instanceUrl : url,
		  accessToken : token
		});

		 var fileOnServer = 'uploads/' + filename + '_merge' + fileextension;

		  fs.readFile(fileOnServer, function (err, filedata) {
	    if (err){
	        console.error(err);
	        return reject(err);
	    }
	    else{
	    	var base64data = new Buffer(filedata).toString('base64');
	    	 conn.sobject('ContentVersion').create({ 
	                Title : filename,
	                VersionData: base64data,
	                PathOnClient : filename + fileextension,  
	            }, 
	            function(err, ret) {
	                 if (err || !ret.success) {
	                 	return reject(err);
	                 }
	                 console.log("Created record id : " + ret.id);
	                 resolve(ret.id);
	        });

	    }

		});
	});

	}

	SFrequestSchema.methods.updateDocRevision = (token, objid, conid, uri) =>{
		return new Promise((resolve, reject) => {
			var options = {
			  method: 'POST',
		  	  url: `${uri}/services/apexrest/CompSuite/updateDocumentRevisionWithPdfLink?objid=${objid}&conid=${conid}`,
			  headers: {
			    'Content-Type': 'application/json',
			    'Authorization': 'Bearer ' + token,
			    'Access-Control-Allow-Origin': '*'
			  }
			};
			function callback(error, response, body) {
			 if (!error && response.statusCode == 200) {

	    		resolve('updateDocRevision success');
			 }else{

			 	return reject(error);
			 }
		}
		request(options, callback);
		});
	}


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

	SFrequestSchema.methods.postContentVersion = (fileName, recordId)=> {
		return new Promise((resolve, reject) => {
			var req = request.post(url, function (err, resp, body) {
				  if (err) {
				    console.log('postContentVersion Error!');
				    return reject(error);
				  } else {
				    console.log('URL: ' + body);
				    resolve('postContentVersion');
				  }
				});
				var form = req.form();
				form.append('file', fs.createReadStream('uploads/' + fileName), {
				  filename: fileName,
				  contentType: 'text/plain'
				});
		});
	}

	 function foo(token, objid, recordType, documentState, pageSize, uri, filename){
		return new Promise((resolve, reject) => {
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
				 	fs.writeFileSync('uploads/' + filename + '_' + pageSize + '.pdf', body,'base64');
				 	templateArr.push(filename + '_' + pageSize + '.pdf');
	    			resolve(1);
				 }else{
				 	return reject(error);
				 }
			}
			request(options, callback);
		});
	}

	SFrequestSchema.methods.getAllTemplates = (sizeSet, token, objid, recordType, documentState, uri, filename) => {
		return new Promise((resolve, reject) => {
			console.log('filename: ' ,filename);
			console.log('getAllTemplates sizeSet: ' + JSON.stringify(sizeSet));
			var counter = 0;
			var setString = sizeSet.toString();
			var setPureSize = setString.substring(1,setString.length - 1);
			var setArr = setPureSize.split(',');
			console.log('getAllTemplates setArr: ' + setArr);
			for(var k = 0 ; k < setArr.length ; k ++){
				let ii = k;
				console.log('getAllTemplates iterate page size: ' + setArr[k]);

				foo(token, objid, recordType, documentState, setArr[k], uri, filename).then((message) => {
				console.log(message + ': ' + ii);
				counter = counter + message;
				console.log('counter: ' + counter);
				if(counter === setArr.length){
					resolve('All templates saved');
				}
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

	SFrequestSchema.methods.uploadTemplates = (appSid, appKey, templateArr) => {
		return new Promise((resolve, reject) => {
			var AppSID = appSid;
			var AppKey = appKey;
			var count = 0;
			for(var j = 0 ; j < templateArr.length ; j++){
				try{
					storageApi.PutCreate(templateArr[j], versionId=null, storage=null, file= 'uploads/' + templateArr[j] , function(responseMessage) {
						if(responseMessage.code === 401){
						var err = 'Upload error';
							return reject(err);
					}
					 count ++;
					 console.log('count: ' + count);
					if(count === templateArr.length - 1){
						resolve('All templates uploaded');
					}
					});
				}catch(e){
					return reject(e);
				}
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
				var watermarkCounter = 0;
				let tempPages = totalPages;
				var pages = [1,2];

				for(var i = 1 ; i <= tempPages ; i ++){
					let ii = i;
					setTimeout(function(){ 
						pdfApi.PutPageAddStamp(name, ii, null, null, stampBody, function(responseMessage) {
							console.log('responseMessage', responseMessage);
							assert.equal(responseMessage.status, 'OK');
							console.log('responseMessage.status',responseMessage.status);
							if(ii === tempPages){
				 				resolve('Water mark text added');
				 			}
						}); 
					}, 1000*ii);
				}
				

				



				// async.each(pages, function(p, callback){
				// 		console.log('p',p);
				// 	  	pdfApi.PutPageAddStamp(name, p, null, null, stampBody, function(responseMessage) {
				// 	  		if(responseMessage.status != 'OK'){
				// 	  			callback('Somthing went wrong');
				// 	  		}
				// 			watermarkCounter ++;
				// 			console.log('watermarkCounter: ' + watermarkCounter);
				// 			if(watermarkCounter === tempPages){
				// 				resolve('Water mark text added');
				// 				callback();
				// 			}
				// 		});
				// });

			// 	for(var i = 1 ; i <= tempPages ; i ++){
			// 		console.log('Iteration: ' + i);
			// 		pdfApi.PutPageAddStamp(name, i, null, null, stampBody, function(responseMessage) {
			// 		assert.equal(responseMessage.status, 'OK');
			// 		watermarkCounter ++;
			// 		console.log('watermarkCounter: ' + watermarkCounter);
			// 		if(watermarkCounter === tempPages){
			// 			resolve('Water mark text added');
			// 		}
			// 	});
			// }
				//resolve('Water mark text added');
			}catch(e){
				return reject(e);
			}
			

		});

	}

	SFrequestSchema.methods.addTepmlatesStamp = (fileName, totalPages , pageIdToTeplateMap) => {
		return new Promise((resolve, reject) => {
			console.log('pageIdToTeplateMap: ' + JSON.stringify(pageIdToTeplateMap));
			console.log('fileName: ' + fileName);
			try{
				var pageStampCounter = 0;
				for(var i = 1 ; i <= totalPages ; i ++){
					let ii = i;
					for(var j = 0 ; j < pageIdToTeplateMap.length ; j ++){
						let jj = j;
						console.log('compare: ' + ' ii = ' + ii + ' pageIdToTeplateMap[jj].page = ' + pageIdToTeplateMap[jj].page);
						if(ii === pageIdToTeplateMap[jj].page){
							console.log('pageIdToTeplateMap[j]',pageIdToTeplateMap[jj]);
							
							setTimeout(function(){
								var template = pageIdToTeplateMap[jj].teplate;
								console.log('template',template);
								var stampBody = {
												'Background' : false,
												'Type' : 'Page',
												'PageIndex': 1,
												'YIndent': 10,
												'FileName' : template + '.pdf'
											}
							console.log('stampBody: ' + JSON.stringify(stampBody));
								console.log('page num: ' + ii);
								pdfApi.PutPageAddStamp(fileName + '_merge.pdf', ii, null, null, stampBody, function(responseMessage) {
									console.log('$$$responseMessage.status: ' + responseMessage.status);
									assert.equal(responseMessage.status, 'OK');
									pageStampCounter ++;
									console.log('pageStampCounter: ' + pageStampCounter);
									if(pageStampCounter === totalPages){
										resolve('All template stamp added');
									}
								});
							},1000*ii);

						}
					}
				}
			}catch(e){
				return reject(e);
			}
		});
	}

	SFrequestSchema.methods.addPageNumberStemp = (fileName, totalPages) =>{
		return new Promise((resolve, reject) => {
			try{
					for(var i = 1 ; i <= totalPages ; i ++){
						let ii = i;
						setTimeout(function(){
							var stampBody = {
							'Value': 'Page # of ' + totalPages,
							'Type': 'PageNumber',
							'Background' : false,
							'BottomMargin': 0.0,
							'topMargin': 0.0,
							'LeftMargin': 0,
							'Opacity': 1.0,
							'RightMargin': 0,
							'Rotate': '0',
							'RotateAngle': 0,
							'VerticalAlignment': '0',
							'HorizontalAlignment': '0',
							'XIndent': 0,
							'Zoom': 1.0,
							'TextAlignment': '0',
							'PageIndex': 0,
							'StartingNumber': 1
						}
						pdfApi.PutPageAddStamp(fileName, ii, null, null, stampBody, function(responseMessage) {
							assert.equal(responseMessage.status, 'OK');
							if(ii === totalPages){
										resolve('All page number stamp added');
									}
						});
						},1000*ii)
						
					}
			}catch(e){
				return reject(e);
			}
		});
	}

	SFrequestSchema.methods.downloadFinalDoc = (fileName) =>{
		return new Promise((resolve, reject) => {
			try{
					storageApi.GetDownload(fileName, null, null, function(responseMessage) {
					assert.equal(responseMessage.status, 'OK');
					var outfilename =  fileName;
					var writeStream = fs.createWriteStream('uploads/' + outfilename);
					writeStream.write(responseMessage.body);
					resolve('Final Document downloaded');
					});
			}catch(e){
				return reject(e);
			}
		});
	}

	// function addSingleTemplate(fileName, stampBody, page, totalPages){
	// 	return new Promise((resolve, reject) => {
	// 		try{
	// 			pdfApi.PutPageAddStamp(fileName + '_merge.pdf', i, null, null, stampBody, function(responseMessage) {
	// 				if(page === totalPages){
	// 					resolve('All template stamp added');
	// 				}
	// 		});
	// 		}catch(e){
	// 			return reject(e);
	// 		}
			
	// 	});
		
	// }



	SFrequestSchema.methods.getPageInfo = (name, totalPages, filename) => {
		return new Promise((resolve, reject) => {
			console.log('getPageInfo totalPages: ' + totalPages);
			try{
				for(var j = 1 ; j <= totalPages ; j ++){
					pdfApi.GetPage(name, j, null, null, function(responseMessage) {
					//console.log(j + ' Page status:' + ' Width:' + responseMessage.body.Page.Rectangle.Width + ' Height: ' + responseMessage.body.Page.Rectangle.Height);	
					var temp = { page: responseMessage.body.Page.Id,
								 size: responseMessage.body.Page.Rectangle.Width + ';' + responseMessage.body.Page.Rectangle.Height
					 			 };
					// console.log('temp: ' + JSON.stringify(temp));
					pagesObj.push(temp);
					var temp2 = {page: responseMessage.body.Page.Id,
								teplate: filename + '_' + responseMessage.body.Page.Rectangle.Width + ';' + responseMessage.body.Page.Rectangle.Height}
					pageIdToTeplateMap.push(temp2);
					var sizes = responseMessage.body.Page.Rectangle.Width +';' + responseMessage.body.Page.Rectangle.Height;
					sizeSet.add(sizes);
					 console.log('pagesObj: ' + JSON.stringify(pagesObj));
					 console.log('sizeSet: ' + JSON.stringify(sizeSet));
					if(pagesObj.length === totalPages){
						resolve('Page Info done');
					}


					});	
					
					
				}
				
				
				
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