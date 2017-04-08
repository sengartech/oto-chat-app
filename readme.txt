One-To-One Chat App Using Socket.io.

GitHub Link : https://github.com/sengartech/oto-chat-app.git

This assignment is created and tested in the following environment:

OS : Ubuntu 16.04 LTS (64-bit).

Editor : Atom 1.15.0 (64-bit).

Browser : Mozilla Firefox 52.0.2 (64-bit).
          Google Chrome 57.0.2987.133 (64-bit).

Third Party Libraries:
 front-end : Bootstrap - for responsive site,
             jQuery - required for js functions,
             moment - to show date and time.
             Socket.io - enables real-time bidirectional event-based communication.

Implementation:

  This app is in mvc based pattern.
  User-end works at (port:3000) : http://localhost:3000/

=> This is a group and one-to-one chat app, with every user identified by unique username(accepted at the signup process),
=> Signup accepts unique username and email with real-time checking with our database.
=> Chat window appears at : http://localhost:3000/chat
=> Users list appears at left block with their current online and offline status.
=> You need to click user button to start chat.
=> For group chat there is also a button.
=> Chat box appears at right, having scrolling function for loading more chats from database.

How to run:
  Note: these instructions are for Ubuntu Linux based OS. Assuming nodejs, npm and mongodb is already installed.

  Step 1: Install all dependencies by using : npm install
  Step 2: Run command to start nodejs app : npm start
  Step 3: Open site at. http://localhost:3000/
  Step 4: You are good to go now. Signup,Login and Chat.


Thats all about it. Thanks :)
