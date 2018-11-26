const mongoose = require('mongoose');
const validator = require('validator');

var DocumentSchema = new mongoose.Schema(
	 {
	 	documentstate:{
	 		type: String,
			required: true,
			minlength: 1,
			trim: true,
	 	},
	 	documentid:{
	 		type: String,
			required: true,
			minlength: 1,
			trim: true,
	 	},
	 	documents:[{
	 		contentdoc:{
	 			type: String,
				required: true,
				minlength: 1,
				trim: true,
	 		},
	 		header:{
	 			type: String,
				required: true,
				minlength: 1,
				trim: true,
	 		},
	 		footer:{
	 			type: String,
				required: true,
				minlength: 1,
				trim: true,
	 		},
	 		signaturepage:{
	 			type: String,
				required: true,
				minlength: 1,
				trim: true,
	 		}
	 		
	 	}]
	
	}
);


var Document = mongoose.model('Document', DocumentSchema);

module.exports = {Document};