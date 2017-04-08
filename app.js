//including dependencies.
var express = require('express');
var app = express();
var http = require('http').Server(app);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var methodOverride = require('method-override');
var path = require('path');
var fs = require('fs');

//requiring socket code from libs folder.
require('./libs/socketioCode.js').sockets(http);

//declaring variables.
var port = process.env.PORT || 3000;

//logging all requests.
app.use(logger('dev'));

//connecting with database.
var dbPath = "mongodb://localhost/chatDB";
mongoose.connect(dbPath);
mongoose.connection.once('open',function(){
  console.log("Database Connection Established.");
});

//initialization of session middleware.
//storing sessions at database instead of local memory for security purpose.
var sessionInit = session({
                    name : 'sessionCookieUser',
                    secret : 'sessionSecretKeyUser',
                    resave : true,
                    httpOnly : true,
                    saveUninitialized: true,
                    store : new mongoStore({mongooseConnection : mongoose.connection}),
                    cookie : { maxAge : 60*60*1000 }
                  });

app.use(sessionInit);

//setting public folder as static.
app.use(express.static(path.resolve(__dirname,'./public')));

//setting views folder and using ejs engine for rendering.
app.set('views', path.resolve(__dirname,'./app/views'));
app.set('view engine', 'ejs');

//parsers for accepting inputs.
app.use(bodyParser.json({limit:'10mb',extended:true}));
app.use(bodyParser.urlencoded({limit:'10mb',extended:true}));
app.use(cookieParser());

//http method override with post having 'put'.
app.use(methodOverride(function(req,res){
  if(req.body && typeof req.body === 'object' && '_method' in req.body){
    //look in urlencoded post bodies and delete it.
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

//including models files.
fs.readdirSync("./app/models").forEach(function(file){
  if(file.indexOf(".js")){
    require("./app/models/"+file);
  }
});

//including controllers files.
fs.readdirSync("./app/controllers").forEach(function(file){
  if(file.indexOf(".js")){
    var route = require("./app/controllers/"+file);
    //calling controllers function and passing app instance.
    route.controller(app);
  }
});


//returning 404 status.
app.use(function(req,res){
  console.log("Page Not Found.");
  res.status(404).render('message',
                          {
                            title:"404",
                            msg:"Page Not Found.",
                            status:404,
                            error:"",
                            user:req.session.user,
                            chat:req.session.chat
                          });
});

//app level middleware for setting logged in user.
//using models.
var userModel = mongoose.model('User');

app.use(function(req,res,next){

	if(req.session && req.session.user){
		userModel.findOne({'email':req.session.user.email},function(err,user){

			if(user){
        req.user = user;
        delete req.user.password;
				req.session.user = user;
        delete req.session.user.password;
				next();
			}

		});
	}
	else{
		next();
	}

});//end of set Logged In User.

//listening app at port 3000.
http.listen(port,function(){
  console.log("Chat App started at port : 3000.");
});
