//including dependencies.
var express = require('express');
var mongoose = require('mongoose');
var events = require('events');

var eventEmitter = new events.EventEmitter();

var auth = require('../../middlewares/auth.js');
var encrypt = require('../../libs/encrypt.js');

var router = express.Router();

//defining model.
var userModel = mongoose.model('User');

//defining controller function.
module.exports.controller = function(app){

  app.use(router);

}//end of controller function.
