//including dependencies.
var crypto = require('crypto');

//method for encrypting password.
module.exports.encryptPassword = function(password){
  var hash = crypto.createHmac('sha256',password)
                   .update("mykey")
                   .digest('hex');
  return hash
};
