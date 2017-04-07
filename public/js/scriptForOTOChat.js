//code for socket chats.
$ (function(){

  var socket = io();
  // console.log("socket is :"+socket);

  var username = $('#user').val();
  var noChat = 0; //setting 0 if all chats histroy is not loaded. 1 if all chats loaded.
  var msgCount = 0; //counting total number of messages displayed.
  var oldInitDone = 0; //it is 0 when old-chats-init is not executed and 1 if executed.
  var roomId;//variable for setting room.
  var toUser;

  //passing data on connection.
  socket.on('connect',function(){
    socket.emit('set-user-data',username);
  });//end of connect event.

  // //passing data on reconnection.
  // socket.on('reconnect',function(){
  //   socket.emit('reconnection');
  // });//end of reconnect event.

  //receiving onlineStack.
  socket.on('onlineStack',function(stack){
    $('#list').empty();
    $('#list').append($('<li>').append($('<button id="ubtn" class="btn btn-user"></button>').text("Group").css({"font-size":"18px"})));
    var totalOnline = 0;
    for (var user in stack){
      //setting txt1. shows users button.
      if(user == username){
        var txt1 = $('<span></span>').text(user).css({"font-size":"18px"});
      }
      else{
        var txt1 = $('<button id="ubtn" class="btn btn-user"></button>').text(user).css({"font-size":"18px"});
      }
      //setting txt2. shows online status.
      if(stack[user] == "Online"){
        var txt2 = $('<span></span>').text("*"+stack[user]).css({"float":"right","color":"#009933","font-size":"18px"});
        totalOnline++;
      }
      else{
        var txt2 = $('<span></span>').text(stack[user]).css({"float":"right","color":"#a6a6a6","font-size":"18px"});
      }
      //listing all users.
      $('#list').append($('<li>').append(txt1,txt2));
      $('#totalOnline').text(totalOnline);
    }//end of for.
    $('#scrl1').scrollTop($('#scrl1').prop("scrollHeight"));
  }); //end of receiving onlineStack event.


  //on button click function.
  $(document).on("click","#ubtn",function(){

    //empty messages.
    $('#messages').empty();
    $('#typing').text("");
    msgCount = 0;
    noChat = 0;
    oldInitDone = 0;

    //assigning friends name to whom messages will send,(in case of group its value is Group).
    toUser = $(this).text();
    console.log("btn clicked..");
    console.log(toUser);

    //showing and hiding relevant information.
    $('#frndName').text(toUser);
    $('#initMsg').hide();
    $('#chatForm').show();

    //assigning two names for room. which helps in one-to-one and also group chat.
    if(toUser == "Group"){
      var currentRoom = "Group-Group";
      var reverseRoom = "Group-Group";
    }
    else{
      var currentRoom = username+"-"+toUser;
      var reverseRoom = toUser+"-"+username;
    }
    console.log(currentRoom);
    console.log(reverseRoom);

    //event to set room and join.
    socket.emit('set-room',{name1:currentRoom,name2:reverseRoom});

    console.log("came");
    console.log(msgCount);

    // socket.emit('old-chats',{username:username,msgCount:msgCount});

  });

  //event for setting roomId.
  socket.on('set-room',function(room){
    //empty messages.
    $('#messages').empty();
    $('#typing').text("");
    msgCount = 0;
    noChat = 0;
    oldInitDone = 0;
    //assigning room id to roomId variable. which helps in one-to-one and group chat.
    roomId = room;
    console.log("roomId : "+roomId);
    //event to get chat history on button click or as room is set.
    socket.emit('old-chats-init',{room:roomId,username:username,msgCount:msgCount});
  });

  //on scroll load more old-chats.
  $('#scrl2').scroll(function(){
    console.log("on scroll");

    if($('#scrl2').scrollTop() == 0 && noChat == 0 && oldInitDone == 1){
      console.log("scroll true");
      $('#loading').show();
      socket.emit('old-chats',{room:roomId,username:username,msgCount:msgCount});
    }

  }); // end of scroll event.

  //listening old-chats event.
  socket.on('old-chats',function(data){

    if(data.room == roomId){
      oldInitDone = 1; //setting value to implies that old-chats first event is done.
      if(data.result.length != 0){
        $('#noChat').hide(); //hiding no more chats message.
        for (var i = 0;i < data.result.length;i++) {
          //styling of chat message.
          var chatDate = moment(data.result[i].createdOn).format("MMMM Do YYYY, hh:mm:ss a");
          var txt1 = $('<span></span>').text(data.result[i].msgFrom+" : ").css({"color":"#006080"});
          var txt2 = $('<span></span>').text(chatDate).css({"float":"right","color":"#a6a6a6","font-size":"16px"});
          var txt3 = $('<p></p>').append(txt1,txt2);
          var txt4 = $('<p></p>').text(data.result[i].msg).css({"color":"#000000"});
          //showing chat in chat box.
          console.log("msg.");
          $('#messages').prepend($('<li>').append(txt3,txt4));
          msgCount++;

        }//end of for.
        console.log(msgCount);
      }
      else {
        $('#noChat').show(); //displaying no more chats message.
        noChat = 1; //to prevent unnecessary scroll event.
      }
      //hiding loading bar.
      $('#loading').hide();

      //setting scrollbar position while first 5 chats loads.
      if(msgCount <= 5){
        $('#scrl2').scrollTop($('#scrl2').prop("scrollHeight"));
      }
    }//end of outer if.

  }); // end of listening old-chats event.

  // key press handler.
  $('#myMsg').keypress(function(){
    socket.emit('typing');
  });

  //receiving typing message.
  socket.on('typing',function(msg){
      $('#typing').text(msg);
  });

  //sending message.
  $('form').submit(function(){
    socket.emit('chat-msg',{msg:$('#myMsg').val(),msgTo:toUser,date:Date.now()});
    $('#myMsg').val("");
    return false;
  }); //end of sending message.

  //receiving messages.
  socket.on('chat-msg',function(data){
    //styling of chat message.
    var chatDate = moment(data.date).format("MMMM Do YYYY, hh:mm:ss a");
    var txt1 = $('<span></span>').text(data.msgFrom+" : ").css({"color":"#006080"});
    var txt2 = $('<span></span>').text(chatDate).css({"float":"right","color":"#a6a6a6","font-size":"16px"});
    var txt3 = $('<p></p>').append(txt1,txt2);
    var txt4 = $('<p></p>').text(data.msg).css({"color":"#000000"});
    //showing chat in chat box.
    $('#messages').append($('<li>').append(txt3,txt4));
      msgCount++;
      console.log(msgCount);
      $('#typing').text("");
      $('#scrl2').scrollTop($('#scrl2').prop("scrollHeight"));
  }); //end of receiving messages.

  //on disconnect event.
  //passing data on connection.
  socket.on('disconnect',function(){
    //showing and hiding relevant information.
    $('#list').empty();
    $('#messages').empty();
    $('#typing').text("");
    $('#frndName').text("Disconnected..");
    $('#loading').hide();
    $('#noChat').hide();
    $('#initMsg').show().text("...Please, Refresh Your Page...");
    $('#chatForm').hide();
    msgCount = 0;
    noChat = 0;
  });//end of connect event.

});//end of function.
