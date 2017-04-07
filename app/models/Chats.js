//including dependencies.
var mongoose = require('mongoose');

//declaring schema object.
var Schema = mongoose.Schema;

var chatSchema = new Schema({

  msgFrom : {type:String,default:"",required:true},
  msgTo : {type:String,default:"",required:true},
  msg : {type:String,default:"",required:true},
  room : {type:String,default:"",required:true},
  createdOn : {type:Date,default:Date.now}

});

//creating model.
mongoose.model('Chat',chatSchema);
