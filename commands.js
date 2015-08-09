var functions = require('./functions.js'),
	mongoose = require('mongoose'),
	chat = mongoose.model('message', schema),
	userdb = mongoose.model('userdb', userschema),
	server = '[Server] '.white.bold,
	error = '[Error] '.red.bold,
	saveMsg,
	userschema = mongoose.Schema({
	username: String,
	password: String,
	isAdmin: Boolean,
	mute: Boolean,
	ban: Boolean,
	banReason: String
}),
	schema = mongoose.Schema({
	msg: String,
	date: {type: Date, default: Date.now}
});

module.exports = {

	//---Commands--------
	// User
	//-------------------

	commands: function (socket, admins, users) { // Shows a list of commands
		var time = functions.getTime(),
			fulldate = Date(),
			timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ';
		users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> ..:: Chat Project commands ::..</font><br/>');
		users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> /commands - shows a list of commands (you are here!)</font><br/>');
		users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> /w username message - sends a whisper/private message to the selected user</font><br/>');
		if (socket.username in admins) {
			users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> ..:: Admin Commands ::..</font><br/>');
			users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> /smsg message - sends a message as the Server</font><br/>');
			users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> /kick username - kicks the user from the chat</font><br/>');
			users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> /ban username reason - bans the user with a set reson [reason is required]</font><br/>');
			users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> /unban username - unbans the user</font><br/>');
		}
	},

	whisper: function (msg, socket, users) { // Sends a private message to another user (isn't logged)
		msg = msg.substr(3); // Remove the '/w '
		var time = functions.getTime(),
			fulldate = Date(),
			timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ',
			errormsg = timeText + '<font color="#5E97FF"><b>[Server]</b> Please make sure you entered a valid username and a valid message</font><br/>',
			index = msg.indexOf(' '); // Find the space, where the message starts
		if (index != -1) { // Checks to see if the space exists
			var name = msg.substring(0, index), // Set the name
				message = msg.substring(index + 1); // Set the message
			if (name in users) { // Make sure the user exists
				users[name].emit('chat message', timeText + '<font color="gray"><b>[Whisper]</b> ' + socket.username + ': ' + message + '</font><br/>');
				users[socket.username].emit('chat message', timeText + '<font color="gray"><b>[Whisper]</b> ' + socket.username + ': ' + message + '</font><br/>');
			} else {
				users[socket.username].emit('chat message', errormsg);
			}
		} else {
			users[socket.username].emit('chat message', errormsg);
		}
	},

	//---Commands--------
	// Admin
	//-------------------

	adminsMsg: function (command, socket, io) { // Sends a message as the server
		var time = functions.getTime(),
			fulldate = Date(),
			timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ';
		msg = command.substr(6); // Remove the '/smsg '
		console.log(server + ('[Admin] ').blue.bold + ' ' + socket.admin + ': ' + msg);
		io.emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> ' + msg + '</font><br/>');
		saveMsg = new chat({ msg: timeText + '<font color="#5E97FF"><b>[Server]</b> ' + msg + '</font><br/>' });
		saveMsg.save(function (errormsg) { if (errormsg) console.log(error + errormsg);	});
	},

	adminKick: function (command, socket, io, users) { // Kicks a user
		var time = functions.getTime(),
			fulldate = Date(),
			timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ';
		target = command.substr(6);
		if (target in users) { // Checks to make sure the user is online
			console.log(server + 'User ' + target + ' has been kicked by ' + socket.username);
			io.emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + target + ' has been kicked from the chat by ' + socket.username + '</font><br/>');
			saveMsg = new chat({ msg: timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + target + ' has been kicked from the chat by ' + socket.username + '</font><br/>' });
			saveMsg.save(function (errormsg) { if (errormsg) console.log(error + errormsg);	});
			users[target].disconnect();
		} else {
			users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + target + ' does not exist<br/>');
		}
	},

	adminBan: function (command, socket, io, users) { // Bans a user (with a reason)
		var time = functions.getTime(),
			fulldate = Date(),
			timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ';
		command = command.substr(5);
		var index = command.indexOf(' '); // Find the space, where the message starts
		if (index != -1) { // Checks to see if the space exists
			var name = command.substring(0, index), // Set the name
				reason = command.substring(index + 1), // Set the reason
				regex = new RegExp(["^", name, "$"].join(""), "i"), // Case insensitive search
				userCheck = userdb.find({ username: regex }); // Check to make sure the user exists
			userCheck.sort().limit(1).exec(function(errormsg, result) {
				if (errormsg) {
					console.log(error + errormsg);
				} else {
					if (result.length == 1) { // If a match is found...
						if (result[0].ban === true) {
							users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> ' + name + ' is already banned</font><br/>');
						} else {
							userdb.update({ username: name }, { ban: true, banReason: reason }, function(err, raw) { if (err) return console.log(err)});
							if (name in users)
								users[name].disconnect();
							console.log(server + name + ' has been banned by ' + socket.username + ' for ' + reason);
							io.emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + name + ' has been banned by ' + socket.username + ' for ' + reason + '</font><br/>');
							saveMsg = new chat({ msg: timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + name + ' has been banned by ' + socket.username + ' for ' + reason + '</font><br/>' });
						}
					} else {
						users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + name + ' was not found</font><br/>');
					}
				}
			});
		} else {
			users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> The command was entered incorrectly - ban name reason</font><br/>');
		}
	},

	adminUnban: function (command, socket, users) { // Unbans a user
		var time = functions.getTime(),
			fulldate = Date(),
			timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ';
		name = command.substr(7);
		var regex = new RegExp(["^", name, "$"].join(""), "i"), // Case insensitive search
			userCheck = userdb.find({ username: regex });
		userCheck.sort().limit(1).exec(function(errormsg, result) {
			if (errormsg) {
				console.log(error + errormsg);
			} else {
				if (result.length == 1) {
					if (result[0].ban === false) {
						users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> ' + name + ' is not banned</font><br/>');
					} else {
						userdb.update({ username: name }, { ban: false, banReason: '' }, function(err, raw) { if (err) return console.log(err)});
						console.log(server + name + ' has been unbanned by ' + socket.username);
						users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> You have unbanned ' + name + '</font><br/>');
					}
				} else {
					users[socket.username].emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + name + ' was not found</font><br/>');
				}
			}
		});
	},

	//---Commands--------
	// CMD
	//-------------------

	cmdKick: function (input, io, users) { // Kicks a user
		var time = functions.getTime(),
			fulldate = Date(),
			timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ';
		input = input.substr(5);
		if (input in users) {
			console.log(server + 'User ' + input + ' has been kicked');
			io.emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + input + ' has been kicked from the chat</font><br/>');
			saveMsg = new chat({ msg: timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + input + ' has been kicked from the chat</font><br/>' });
			users[input].disconnect();
		} else {
			console.log(error + 'User ' + input + ' does not exist');
		}
	},

	cmdBan: function (input, io, users) { // Bans a user (with a reason)
		var time = functions.getTime(),
			fulldate = Date(),
			timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ';
		input = input.substr(4);
		var index = input.indexOf(' '); // Find the space, where the message starts
		if (index != -1) { // Checks to see if the space exists
			var name = input.substring(0, index), // Set the name
				reason = input.substring(index + 1), // Set the reason
				regex = new RegExp(["^", name, "$"].join(""), "i"), // Case insensitive search
				userCheck = userdb.find({ username: regex });
			userCheck.sort().limit(1).exec(function(errormsg, result) {
				if (errormsg) {
					console.log(error + errormsg);
				} else {
					if (result.length == 1) {
						if (result[0].ban === true) {
							console.log(server + name + ' is already banned');
						} else {
							userdb.update({ username: name }, { ban: true, banReason: reason }, function(err, raw) { if (err) return console.log(err)});
							if (name in users)
								users[name].disconnect();
							console.log(server + name + ' has been banned');
							io.emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + name + ' has been banned for ' + reason + '</font><br/>');
							saveMsg = new chat({ msg: timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + name + ' has been banned for ' + reason + '</font><br/>' });
						}
					} else {
						console.log(error + 'User ' + name + ' was not found');
					}
				}
			});
		} else {
			console.log(error + 'The command was entered incorrectly - ban name reason');
		}
	},

	cmdUnban: function (input) { // Unbans a user
		name = input.substr(6);
		var regex = new RegExp(["^", name, "$"].join(""), "i"), // Case insensitive search
			userCheck = userdb.find({ username: regex });
		userCheck.sort().limit(1).exec(function(errormsg, result) {
			if (errormsg) { 
				console.log(error + errormsg);
			} else {
				if (result.length == 1) {
					if (result[0].ban === false) {
						console.log(error + name + ' is not banned');
					} else {
						userdb.update({ username: name }, { ban: false, banReason: '' }, function(err, raw) { if (err) return console.log(err)});
						console.log(server + name + ' has been unbanned');
					}
				} else {
					console.log(error + 'User ' + name + ' was not found');
				}
			}
		});
	},

	cmdAdmin: function (input, io, users, admins) { // Sets or removes a user to the admin group
		var time = functions.getTime(),
			fulldate = Date(),
			timeText = '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ';
		input = input.substr(6);
		index = input.indexOf(' '); // Find the space, where the message starts
		if (index != -1) { // Checks to see if the space exists
			var name = input.substring(0, index), // Set the name
				trufal = input.substring(index + 1), // Set the true/false
				regex = new RegExp(["^", name, "$"].join(""), "i"), // Case insensitive search
				userCheck = userdb.find({ username: regex }); // Check to make sure the user exists
			userCheck.sort().limit(1).exec(function(errormsg, result) {
				if (errormsg) { 
					console.log(error + errormsg);
				} else {
					if (result.length == 1) { // If a match is found...
						if (trufal == 'true') {
							if (result[0].isAdmin === true) { // If the user enters true
								console.log(server + name + ' is already an admin');
							} else {
								userdb.update({ username: name }, { isAdmin: true }, function(err, raw) { if (err) return console.log(err)});
								console.log(server + name + ' has been made an admin');
								io.emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + name + ' has been promoted to an Admin</font><br/>');
								saveMsg = new chat({ msg: timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + name + ' has been promoted to an Admin</font><br/>' });
								if (name in users) // If the user is online
									admins[name]++; // ...have that user added to the admin group
							}
						} else if (trufal == 'false') {
							if (result[0].isAdmin === false) { // If the user enters false
								console.log(server + name + ' is not an admin');
							} else {
								userdb.update({ username: name }, { isAdmin: false }, function(err, raw) { if (err) return console.log(err)});
								console.log(server + name + ' has been removed from the admin group');
								io.emit('chat message', timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + name + ' has been demoted to a User</font><br/>');
								saveMsg = new chat({ msg: timeText + '<font color="#5E97FF"><b>[Server]</b> User ' + name + ' has been demoted to a User</font><br/>' });
								if (name in admins) // If the user is online
									delete admins[name]; // ...have that user removed from the admin group
							}
						} else {
							console.log(error + 'You must enter true or false')
						}
					} else {
						console.log(error + 'User ' + name + ' was not found');
					}
				}
			});
		} else {
			console.log(error + 'The command was not entered correctly - admin name true/false');
		}
	}
}