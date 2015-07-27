var express = require('express'),
	app = express(),
	port = Number(process.env.PORT || 3000),
	io = require('socket.io').listen(app.listen(port)),
	colors = require('colors'),
	mongoose = require('mongoose'),
	server = '[Server] '.white.bold,
	error = '[Error] '.red.bold,
	users = [],
	ips = [];

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

io.on('connection', function (socket) {
	var query = chat.find({});
	query.sort('-created').limit(50).exec(function (errormsg, msgs) { // Load the last 50 messages in order
		if (errormsg) console.log(error + errormsg);
		socket.emit('load messages', msgs);
	});

	socket.on('new user', function (data, callback) {
		var user = /^[\w]{1,15}$/; // Username can only contain letters, numbers and can be 1-15 characters long
		var userip = socket.request.connection.remoteAddress; // Get IP - Unshortend
		if (users.indexOf(data) != -1) { // Username is already taken
			callback(false);
		} else if (ips.indexOf(userip) != -1) { // IP is already in use
			callback(false);
		} else if (!user.test(data)) { // Username has invalid characters
			callback(false);
		} else if (data == null) { // No username was entered
			callback(false);
		} else {
			callback(true);
			socket.users = data;
			socket.ips = userip;
			users.push(socket.users);
			ips.push(socket.ips)
			updateNicknames();
			console.log(server + 'New User: ' + data + ' IP: ' + userip);
			io.emit('chat message', '<font color="#5E97FF"><b>[Server]</b> ' + data + ' has joined</font><br/>');
		}
	});

	socket.on('disconnect', function () {
		if (!socket.users) return;
		if (!socket.ips) return;
		users.splice(users.indexOf(socket.users), 1); // Remove user from list
		ips.splice(ips.indexOf(ips.users), 1); // Remove ip from list
		updateNicknames();
		console.log(server + 'User Left: ' + socket.users);
		io.emit('chat message', '<font color="#4E7ACC"><b>[Server]</b> ' + socket.users + ' has left</font><br/>');
	});

	function updateNicknames() {
		io.sockets.emit('usernames', users); // Updates the userlist
	}

	function getURL(text) {
		var link = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
		return text.replace(link, "<a href='$1'>$1</a>"); 
	}

	socket.on('chat message', function (msg) {
		if (!msg == "") { // Check to make sure a message was entered
			if (!socket.users == "") { // Check to make sure the client has a username
				var newMsg;
				if (msg.indexOf("<") == -1) { // Check if the user is trying to use html
					var noHTML = msg; // Just so you don't get HTML in the console
					if (noHTML.indexOf("http") >= 0) { // Check to see if there's a link
						var noHTML = getURL(noHTML);
					}
					io.emit('chat message', '<b>' + socket.users + '</b>: ' + noHTML + '<br/>');
					console.log(('[User] ').gray.bold + socket.users + ': ' + msg);
					newMsg = new chat({msg: '<b>' + socket.users + '</b>: ' + noHTML + '<br/>'});
				} else {
					var htmlRemoval = msg.replace(/</g, '&lt;'); // Changes the character to show as a <, but will not work with HTML
					if (htmlRemoval.indexOf("http") >= 0) { // Check to see if there's a link
						var htmlRemoval = getURL(htmlRemoval);
					}
					io.emit('chat message', '<b>' + socket.users + '</b>: ' + htmlRemoval + '<br/>');
					console.log(('[User] ').gray.bold + socket.users + ': ' + msg);
					newMsg = new chat({msg: '<b>' + socket.users + '</b>: ' + htmlRemoval + '<br/>'});
				}
				newMsg.save(function (errormsg) { // Save the msgs to mongodb
					if (errormsg) console.log(error + errormsg);
				});
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
	} else { // Anything else that's entered is sent as a server message
		io.emit('chat message', '<font color="#5E97FF"><b>[Server]</b> ' + input + '</font><br/>');
	}
});