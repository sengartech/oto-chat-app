//including dependencies.
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var methodOverride = require('method-override');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var events = require('events');
var eventEmitter = new events.EventEmitter();

//including libs and middlewares.
var auth = require('./middlewares/auth.js');
var soc = require('./middlewares/sockets.js');

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
//making request and response variable available in socket.
// io.use(function(socket,next){
//   sessionInit(socket.req,socket.res,next);
// });

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


//router for chat window.
app.get('/chat',auth.checkLogin,function(req,res){

  res.render('chat',
              {
                title:"Chat Home",
                user:req.session.user,
                chat:req.session.chat
              });
});

//using models.
var userModel = mongoose.model('User');
var chatModel = mongoose.model('Chat');
var roomModel = mongoose.model('Room');

//saving chats to database.
eventEmitter.on('save-chat',function(data){

  // var today = Date.now();

  var newChat = new chatModel({

    msgFrom : data.msgFrom,
    msgTo : data.msgTo,
    msg : data.msg,
    room : data.room,
    createdOn : data.date

  });

  newChat.save(function(err,result){
    if(err){
      console.log("Error : "+err);
    }
    else if(result == undefined || result == null || result == ""){
      console.log("Chat Is Not Saved.");
    }
    else{
      console.log("Chat Saved.");
      console.log(result);
    }
  });

}); //end of saving chat.

//declaring variables for functions.
var oldChats;

//reading chat from database.
eventEmitter.on('read-chat',function(data){

  chatModel.find({})
           .where('room').equals(data.room)
           .sort('-createdOn')
           .skip(data.msgCount)
           .lean()
           .limit(5)
           .exec(function(err,result){
              if(err){
                console.log("Error : "+err);
              }
              else{
                //calling function which emits event to client to show chats.
                oldChats(result,data.username,data.room);
              }
            });
}); //end of reading chat from database.

var userStack = {};
var sendUserStack;

//listening for get-all-users event. creating list of all users.
eventEmitter.on('get-all-users',function(){
  userModel.find({})
           .select('username')
           .exec(function(err,result){
             if(err){
               console.log("Error : "+err);
             }
             else{
               //console.log(result);
               for(var i = 0; i < result.length; i++){
                 userStack[result[i].username] = "Offline";
               }
               //console.log("stack "+Object.keys(userStack));
               sendUserStack();
             }
           });
});

//listening get-room-data event.
eventEmitter.on('get-room-data',function(room){
  roomModel.find({$or:[{name1:room.name1},{name1:room.name2},{name2:room.name1},{name2:room.name2}]},function(err,result){
    if(err){
      console.log("Error : "+err);
    }
    else{
      if(result == "" || result == undefined || result == null){

                  var today = Date.now();

                  newRoom = new roomModel({
                    name1 : room.name1,
                    name2 : room.name2,
                    lastActive : today,
                    createdOn : today
                  });

                  newRoom.save(function(err,newResult){

                    if(err){
                      console.log("Error : "+err);
                    }
                    else if(newResult == "" || newResult == undefined || newResult == null){
                      console.log("Some Error Occured During Room Creation.");
                    }
                    else{
                      console.log("create:");
                      setRoom(newResult._id); //calling setRoom function.
                    }
                  }); //end of saving room.

      }
      else{
        var jresult = JSON.parse(JSON.stringify(result));
        console.log("find:");
        setRoom(jresult[0]._id); //calling setRoom function.
      }
    } //end of else.
  }); //end of find room.
}); //end of get-room-data listener.

var userSocket = {};

//socket related code.
//code for socket.io
io.on('connection', function(socket){

  // console.log(socket);

  //getting user name.
  socket.on('set-user-data',function(username){

    //storing variable.
    socket.username = username;
    userSocket[socket.username] = socket.id;

    //getting all users list.
    eventEmitter.emit('get-all-users');

    //sending all users list. and setting if online or offline.
    sendUserStack = function(){
      for(i in userSocket){
        for(j in userStack){
          if(j == i){
            userStack[j] = "Online";
          }
        }
      }
      //for popping connection message.
      io.emit('onlineStack',userStack);
    } //end of sendUserStack function.

  });

  //setting room.
  socket.on('set-room',function(room){
    //leaving room.
    socket.leave(socket.room);
    //getting room data.
    eventEmitter.emit('get-room-data',room);
    //setting room and join.
    setRoom = function(roomId){
      socket.room = roomId;
      console.log(socket.room);
      socket.join(socket.room);
      io.to(userSocket[socket.username]).emit('set-room',socket.room);
    };

  }); //end of set-room event.

  //emits event to read old-chats-init from database.
  socket.on('old-chats-init',function(data){
    console.log("bh check.");
    eventEmitter.emit('read-chat',data);
  });

  //emits event to read old chats from database.
  socket.on('old-chats',function(data){
    console.log("ch check.");
    eventEmitter.emit('read-chat',data);
  });

  //sending old chats to client.
  oldChats = function(result,username,room){
    io.to(userSocket[username]).emit('old-chats',{result:result,room:room});
  }

  //showing msg on typing.
  socket.on('typing',function(){
    socket.to(socket.room).broadcast.emit('typing',socket.username+" : is typing...");
  });

  //for showing chats.
  socket.on('chat-msg', function(data){
    //emits event to save chat to database.
    eventEmitter.emit('save-chat',{msgFrom:socket.username,msgTo:data.msgTo,msg:data.msg,room:socket.room,date:data.date});
    //emits event to send chat msg to all clients.
    io.to(socket.room).emit('chat-msg',{msgFrom:socket.username,msg:data.msg,date:data.date});
  });

  //for popping disconnection message.
  socket.on('disconnect', function(){

    // _.unset(loadedChats,socket.username);
    _.unset(userSocket,socket.username);
    userStack[socket.username] = "Offline";

    io.emit('onlineStack',userStack);
  });

}); //end of io.on(connection).


//
//
//
//


//to verify for unique username and email at signup.
//socket namespace for signup.
var ioSignup = io.of('/signup');
ioSignup.on('connection',function(socket){
  console.log("signup connected.");

  //verifying unique username.
  socket.on('checkUname',function(uname){
    userModel.find({'username':uname},function(err,result){
      if(err){
        console.log("Error : "+err);
      }
      else{
        //console.log(result);
        if(result == ""){
          socket.emit('checkUname',1); //send 1 if username not found.
        }
        else{
          socket.emit('checkUname',0); //send 0 if username found.
        }
      }
    });
  });

  //verifying unique email.
  socket.on('checkEmail',function(email){
    userModel.find({'email':email},function(err,result){
      if(err){
        console.log("Error : "+err);
      }
      else{
        //console.log(result);
        if(result == ""){
          socket.emit('checkEmail',1); //send 1 if email not found.
        }
        else{
          socket.emit('checkEmail',0); //send 0 if email found.
        }
      }
    });
  });

  //on disconnection.
  socket.on('disconnect',function(){
    console.log("signup disconnected.");
  });
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
//app.use(auth.setLoggedInUser(req,res,next));

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

});//end of setLoggedInUser.

//listening app at port 3000.
http.listen(port,function(){
  console.log("Chat App started at port : 3000.");
});
