var express = require('express'),
	app = express(),
	port = Number(process.env.PORT || 3000),
	io = require('socket.io').listen(app.listen(port)),
	colors = require('colors'),
	mongoose = require('mongoose'),
	getmac = require('getmac'),
	server = '[Server] '.white.bold,
	error = '[Error] '.red.bold,
	users = {},
	macs = {},
	macAdd,
	saveMsg;

console.log(server + 'listening @ localhost:' + port);

mongoose.connect('mongodb://localhost/chat', function(errormsg){
	if (errormsg) {
		console.log(error + errormsg);
	} else {
		console.log(server + 'Connected to MongoDB');
	}
});

var schema = mongoose.Schema({
	msg: String,
	date: {type: Date, default: Date.now}
});

var chat = mongoose.model('message', schema);

app.use('/images', express.static('images'));
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/chat.html');
});

require('getmac').getMac(function(err, macAddress) { // Get the mac address
	if (err) onsole.log(err);
	macAdd = macAddress;
});

io.on('connection', function (socket) {
	var query = chat.find({});
	query.sort('-date').limit(50).exec(function(errormsg, msgs) { // Load the last 50 messages in order
		if (errormsg) console.log(error + errormsg);
		socket.emit('load messages', msgs);
	});

	socket.on('new user', function (data, callback) {
		var user = /^[\w]{1,15}$/; // Username can only contain letters, numbers and can be 1-15 characters long
		if (macs[macAdd]) // If the mac address doesn't exist yet,
			macs[macAdd]++; // add it
		else
			macs[macAdd] = 1; // If not, have another instance added

		if (data in users) { // Username is already taken
			macs[macAdd]--;
			callback('Someone else already has this username');
		} else if (!user.test(data)) { // Username has invalid characters
			macs[macAdd]--;
			callback('Your username contains invalid characters or is too long. Your username can only contain letters and numbers (1-15 characters long)');
		} else if (data == null) { // No username was entered
			macs[macAdd]--;
			callback('Please enter a username');
		} else if (macs[macAdd] >= 4) {
			macs[macAdd]--;
			callback('You already have 3 chats open');
		} else {
			callback('success');
			connect(data);
		}
	});

	function connect(data) {
		socket.username = data;
		users[socket.username] = socket;
		updateNicknames();
		console.log(macs);
		console.log(server + 'New User: ' + data + ' MAC: ' + macAdd);
		io.emit('chat message', '<font color="#5E97FF"><b>[Server]</b> ' + data + ' has joined</font><br/>');
		saveMsg = new chat({ msg: '<font color="#5E97FF"><b>[Server]</b> ' + data + ' has joined</font><br/>' });
		saveMsg.save(function (errormsg) { if (errormsg) console.log(error + errormsg);	});
	}

	socket.on('disconnect', function () {
		if (!socket.username) return;
		delete users[socket.username]; // Remove user from list
		delete macs[macAdd]; // Remove MAC address from list
		updateNicknames();
		console.log(server + 'User Left: ' + socket.username);
		io.emit('chat message', '<font color="#4E7ACC"><b>[Server]</b> ' + socket.username + ' has left</font><br/>');
		saveMsg = new chat({ msg: '<font color="#4E7ACC"><b>[Server]</b> ' + socket.username + ' has left</font><br/>' });
		saveMsg.save(function (errormsg) { if (errormsg) console.log(error + errormsg);	});
	});

	function getTime() {
		var timestring = "",
			ampm = "",
			currentTime = new Date(),
			hours = currentTime.getHours(),
			minutes = currentTime.getMinutes();

		if (minutes < 10) {
			minutes = "0" + minutes;
		}
		if(hours > 11){
			ampm = "PM";
			hours = hours % 12;
			if (hours == 0)
				hours = 12;
		} else {
			ampm = "AM";
		}
		timestring = hours + ":" + minutes + " " + ampm;
		return timestring;
	}

	function updateNicknames() {
		io.sockets.emit('usernames', Object.keys(users)); // Updates the userlist
	}

	function getURL(text) {
		var link = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return text.replace(link, "<a href='$1'>$1</a>"); 
	}

	function whisper(msg) {
		var errormsg = '<font color="#5E97FF"><b>[Server]</b> Please make sure you entered a valid username and a valid message</font><br/>';
		msg = msg.substr(3); // Remove the '/w '
		var index = msg.indexOf(' '); // Find the space, where the message starts
		if (index != -1) { // Checks to see if the space exists
			var name = msg.substring(0, index); // Set the name
			var message = msg.substring(index + 1); // Set the message
			if (name in users) { // Make sure the user exists
				users[name].emit('chat message', '<font color="gray"><b>[Whisper]</b> ' + socket.username + ': ' + message + '</font><br/>');
				users[socket.username].emit('chat message', '<font color="gray"><b>[Whisper]</b> ' + socket.username + ': ' + message + '</font><br/>');
			} else {
				users[socket.username].emit('chat message', errormsg);
			}
		} else {
			users[socket.username].emit('chat message', errormsg);
		}
	}

	function message(msg) {
		var time = getTime();
		var fulldate = Date();
		if (msg.indexOf("<") == -1) { // Check if the user is trying to use html
			var noHTML = msg; // Just so you don't get HTML in the console
			if (noHTML.indexOf("http") >= 0) { // Check to see if there's a link
				var noHTML = getURL(noHTML);
			}
			io.emit('chat message', '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ' + '<b>' + socket.username + '</b>: ' + noHTML + '<br/>');
			console.log(('[User] ').gray.bold + time + ' ' + socket.username + ': ' + msg);
			saveMsg = new chat({msg: '<font size="2" data-toggle="tooltip" data-placement="auto-right" title="' + fulldate + '"><' + time + '></font> ' + '<b>' + socket.username + '</b>: ' + noHTML + '<br/>'});
		} else {
			var htmlRemoval = msg.replace(/</g, '&lt;'); // Changes the character to show as a <, but will not work with HTML
			if (htmlRemoval.indexOf("http") >= 0) { // Check to see if there's a link
				var htmlRemoval = getURL(htmlRemoval);
		}
		io.emit('chat message', '<font size="2" data-toggle="tooltip" title="' + fulldate + '"><' + time + '></font> ' + '<b>' + socket.username + '</b>: ' + htmlRemoval + '<br/>');
		console.log(('[User] ').gray.bold + time + ' ' + socket.username + ': ' + msg);
		saveMsg = new chat({msg: '<font size="2" data-toggle="tooltip" title="' + fulldate + '"><' + time + '></font> ' + '<b>' + socket.username + '</b>: ' + htmlRemoval + '<br/>'});
		}
		saveMsg.save(function (errormsg) { if (errormsg) console.log(error + errormsg);	});
	}
	
	socket.on('chat message', function (msg) {
		if (!msg == "") { // Check to make sure a message was entered
			if (!socket.username == "") { // Check to make sure the client has a username
				if(msg.substr(0, 3) === '/w ') { // Check for whisper
					whisper(msg);
				} else {
					message(msg);
				}
			}
		}
	});
});

//--------------
// CMD Commands
//--------------

var stdin = process.stdin, stdout = process.stdout;

stdin.resume();
stdin.on('data', function (data) {
	var input = data.toString().trim(); // Take out any unecessary spaces
	if (input == 'shutdown') { // Shutdown command
		console.log(server + 'Shutting down...');
		mongoose.disconnect;
		process.exit();
	} else if (input.substr(0, 5) === 'kick ') { // Kick command
		input = input.substr(5);
		if (input in users) {
			console.log(server + 'User ' + input + ' has been kicked');
			io.emit('chat message', '<font color="#5E97FF"><b>[Server]</b> User ' + input + ' has been kicked from the chat</font><br/>');
			saveMsg = new chat({ msg: '<font color="#5E97FF"><b>[Server]</b> User ' + input + ' has been kicked from the chat</font><br/>' });
			users[input].disconnect();
		} else {
			console.log(server + 'user ' + input + ' does not exist');
		}
	} else { // Anything else that's entered is sent as a server message
		io.emit('chat message', '<font color="#5E97FF"><b>[Server]</b> ' + input + '</font><br/>');
		saveMsg = new chat({ msg: '<font color="#5E97FF"><b>[Server]</b> ' + input + '</font><br/>' });
	}
	saveMsg.save(function (errormsg) { if (errormsg) console.log(error + errormsg);	});
});