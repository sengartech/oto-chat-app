//including dependencies.
var express = require('express');

var auth = require('../../middlewares/auth.js');

var router = express.Router();

//defining controller function.
module.exports.controller = function(app){

  //router for chat window.
  app.get('/chat',auth.checkLogin,function(req,res){

    res.render('chat',
                {
                  title:"Chat Home",
                  user:req.session.user,
                  chat:req.session.chat
                });
  });

  app.use(router);

}//end of controller function.
