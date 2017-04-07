//including dependencies.
var express = require('express');
var mongoose = require('mongoose');

// var auth = require('../../middlewares/auth.js');
// var encrypt = require('../../libs/encrypt.js');

var router = express.Router();

//defining model.
var userModel = mongoose.model('User');

//defining controller function.
module.exports.controller = function(app){

  //router for home.
  router.get('/',function(req,res){
    res.redirect('/user/login');
  });

  app.use(router);

}//end of controller function.
