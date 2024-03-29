var mongoose = require('mongoose'),
	bcrypt = require('bcrypt-nodejs'),
	functions = require('./functions.js'),
	server = '[Server] '.white.bold,
	error = '[Error] '.red.bold,
	userdb = mongoose.model('userdb', userschema),
	chat = mongoose.model('message', schema),
	schema = mongoose.Schema({
	msg: String,
	txtID: String,
	rawMsg: String,
	deleted: Boolean,
	timeText: String,
	username: String,
	date: { type: Date, default: Date.now }
}),
	userschema = mongoose.Schema({
	username: String,
	password: String,
	isAdmin: Boolean,
	mute: Boolean,
	ban: Boolean,
	banReason: String
});

exports.getTime = function() {
	var timestring,
		ampm,
		currentTime = new Date(),
		hours = currentTime.getHours(),
		minutes = currentTime.getMinutes();

	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if(hours > 11){
		ampm = "PM";
		hours = hours % 12;
	} else {
		if (hours == 0) { // 12:00am instead of 0:00am
			hours = 12;
		}
		ampm = "AM";
	}
	timestring = hours + ":" + minutes + " " + ampm;
	return timestring;
}

exports.register = function(registerData, callback) {
	var dataUsername = registerData.username, dataPassword = registerData.password,
		saveUser,
		user = /^[\w]{1,15}$/,
	userCheck = userdb.find({ username: dataUsername }); // check to make sure the username doesn't already exist
	userCheck.sort().limit(1).exec(function(errormsg, registerData) {
		if (errormsg) { 
			console.log(error + errormsg);
			callback('An error has occoured, please contact an administrator');
		} else {
			if (registerData.length == 1) {
				callback('That username is already taken');
			} else if (!user.test(dataUsername)) {
				callback('Your username contains invalid characters or is too long. Your username can only contain letters and numbers (1-15 characters long)');
			} else {
				bcrypt.genSalt(10, function(err, salt) {
					bcrypt.hash(dataPassword, salt, null, function(errormsg, hash) {
						/*if (error) { // it seems to always return 'undefined', even though the hash was created successfully
							console.log(error + errormsg + ' ..at hash!' + hash);
							callback('An error has occoured, please contact an administrator');	
						} else {*/
							saveUser = new userdb ({ username: dataUsername, password: hash, isAdmin: false, ban: false, banReason: '' });
							saveUser.save(function (errormsg) {
								if (errormsg) {
									console.log(error + errormsg + ' ...at save!');
									callback('An error has occoured, please contact an administrator');
								} else {
									callback('success');
									console.log(server + 'New user: ' + dataUsername);
								}
							});
					//	}
					});
				});
			}
		}
	});
}

exports.login = function(data, callback, socket, io, admins, users) {
	var loginUsername = data.username, loginPassword = data.password,
		login,
		time = functions.getTime(),
		fulldate = Date(),
		regex = new RegExp(["^", loginUsername, "$"].join(""), "i"); // Case insensitive search
		userCheck = userdb.find({ username: regex });
	userCheck.sort().limit(1).exec(function(errormsg, result) {
		if (errormsg) { 
			console.log(error + errormsg);
			callback('An error has occoured, please contact an administrator');
		} else {
			if (result.length == 1) {
				var dbUsername = result[0].username, dbPassword = result[0].password, dbisAdmin = result[0].isAdmin, dbBan = result[0].ban, dbbanReason = result[0].banReason;
				bcrypt.compare(loginPassword, dbPassword, function(errormsg, res) {
					if (errormsg) {
						console.log(error + errormsg);
						callback('An error has occoured, please contact an administrator');
					} else {
						if (res) {
							if (dbBan == true) {
								callback('Your account is banned\r\nReason: ' + dbbanReason);
							} else if (dbUsername in users) {
								callback('You are already logged in');
							} else {
								var time = functions.getTime(),
									fulldate = Date(),
									timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ';
								socket.username = dbUsername;
								users[socket.username] = socket;
								if (dbisAdmin === true) {
									admins[socket.username]++;
								}
								functions.updateNicknames(io, users);
								console.log(server + 'User has logged in - Username: ' + dbUsername);
								io.emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> ' + dbUsername + ' has joined</font><br/>');
								saveMsg = new chat({ msg: timeText + '<font color="#5E97FF"><b>[Server]</b> ' + dbUsername + ' has joined</font><br/>' });
								saveMsg.save(function (errormsg) { if (errormsg) console.log(error + errormsg);	});
								callback('success');
							}
						} else {
							callback('Your password is incorrect');
						}
					}
				});
			} else {
				callback('That username does not exist in our database');
			}
		}
	});
}

exports.guid = function() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + s4();
}

exports.message = function(msg, socket, io) {
	var time = functions.getTime(),
		fulldate = Date(),
		getID = functions.guid(),
		idSpan = '<span id="' + getID + '">',
		timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ';
	if (msg.indexOf("<") == -1) { // Check if the user is trying to use html
		var noHTML = msg; // Just so you don't get HTML in the console
		if (noHTML.indexOf("http") >= 0) { // Check to see if there's a link
			noHTML = functions.getURL(noHTML);
		}
		io.emit('chat message', idSpan + timeText + '<b>' + socket.username + '</b>: ' + noHTML + '</span><br/>');
		console.log(('[User] ').gray.bold + time + ' ' + socket.username + ': ' + msg);
		saveMsg = new chat({ txtID: getID, msg: idSpan + timeText + '<b>' + socket.username + '</b>: ' + noHTML + '<br/></span>', rawMsg: msg, timeText: timeText, username: socket.username });
	} else {
		var htmlRemoval = msg.replace(/</g, '&lt;'); // Changes the character to show as a <, but will not work with HTML
		if (htmlRemoval.indexOf("http") >= 0) { // Check to see if there's a link
			htmlRemoval = functions.getURL(htmlRemoval);
		}
		io.emit('chat message', idSpan + timeText + '<b>' + socket.username + '</b>: ' + htmlRemoval + '<br/>');
		console.log(('[User] ').gray.bold + time + ' ' + socket.username + ': ' + msg);
		saveMsg = new chat({ id: txtgetID, msg: idSpan + timeText + '<b>' + socket.username + '</b>: ' + htmlRemoval + '<br/></span>', rawMsg: msg, timeText: timeText, username: socket.username });
	}
	saveMsg.save(function (errormsg) { if (errormsg) console.log(error + errormsg);	});
}

exports.adminMessage = function(msg, socket, io) {
	var time = functions.getTime(),
		fulldate = Date(),
		getID = functions.guid(),
		idSpan = '<span id="' + getID + '">',
		timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ',
		linkMsg = msg; // Just so you don't get HTML in the console
	if (linkMsg.indexOf("http") >= 0) { // Check to see if there's a link
		linkMsg = functions.getURL(linkMsg);
	}
	io.emit('chat message', idSpan + timeText + '<b><font color="#2471FF">[Admin] ' + socket.username + '</font></b>: ' + linkMsg + '<br/></span>');
	console.log(('[Admin] ').blue.bold + time + ' ' + socket.username + ': ' + msg);
	saveMsg = new chat({ txtID: getID, msg: idSpan + timeText + '<b><font color="#2471FF">[Admin] ' + socket.username + '</font></b>: ' + linkMsg + '<br/></span>', rawMsg: msg, timeText: timeText, username: socket.username });
	saveMsg.save(function (errormsg) { if (errormsg) console.log(error + errormsg);	});
}

exports.editMessage = function(socket, msg, admins, originalTT) {
	if (socket.username in admins) {
		var linkMsg = msg; // Just so you don't get HTML in the console
		if (linkMsg.indexOf("http") >= 0) { // Check to see if there's a link
			linkMsg = functions.getURL(linkMsg);
		}
		return originalTT + '<b><font color="#2471FF">[Admin] ' + socket.username + '</font></b>: ' + linkMsg;
	} else {
		if (msg.indexOf("<") == -1) { // Check if the user is trying to use html
			var noHTML = msg; // Just so you don't get HTML in the console
			if (noHTML.indexOf("http") >= 0) { // Check to see if there's a link
				noHTML = functions.getURL(noHTML);
			}
			return originalTT + '<b>' + socket.username + '</b>: ' + noHTML;
		} else {
			var htmlRemoval = msg.replace(/</g, '&lt;'); // Changes the character to show as a <, but will not work with HTML
			if (htmlRemoval.indexOf("http") >= 0) { // Check to see if there's a link
				htmlRemoval = functions.getURL(htmlRemoval);
			}
			return originalTT + '<b>' + socket.username + '</b>: ' + htmlRemoval;
		}
	}
}

exports.getURL = function(text) {
	var link = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	return text.replace(link, "<a href='$1' target='_blank'>$1</a>"); 
}

exports.updateNicknames = function(io, users) {
	io.sockets.emit('usernames', Object.keys(users));
}