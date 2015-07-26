var express = require('express'),
	app = express(),
	port = Number(process.env.PORT || 3000),
	io = require('socket.io').listen(app.listen(port)),
	colors = require('colors'),
	server = '[Server]'.white.bold,
	users = [],
	ips = [];

console.log(server + ' listening @ localhost:' + port);

app.use('/images', express.static('images'));
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/chat.html');
});

io.on('connection', function (socket) {
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
			console.log(server + ' New User: ' + data + ' IP: ' + userip);
			io.emit('chat message', '<font color="#5E97FF"><b>[Server]</b> ' + data + ' has joined</font><br/>');
		}
	});

	socket.on('disconnect', function () {
		if (!socket.users) return;
		if (!socket.ips) return;
		users.splice(users.indexOf(socket.users), 1); // Remove user from list
		ips.splice(ips.indexOf(ips.users), 1); // Remove ip from list
		updateNicknames();
		console.log(server + ' User Left: ' + socket.users);
		io.emit('chat message', '<font color="#4E7ACC"><b>[Server]</b> ' + socket.users + ' has left</font><br/>');
	});

	function updateNicknames() {
		io.sockets.emit('usernames', users); // Updates the userlist
	}

	socket.on('chat message', function (msg) {
		if (!msg == "") { // Check to make sure a message was entered
			if (!socket.users == "") { // Check to make sure the client has a username
				if (msg.indexOf("<")) { // Check if the user is trying to use html
					io.emit('chat message', '<b>' + socket.users + '</b>: ' + msg + '<br/>');
					console.log(('[User] ').gray.bold + socket.users + ': ' + msg);
				} else {
					var newmsg = msg.replace(/</g, '&lt;'); // Changes the character to show as a <, but not work with HTML
					io.emit('chat message', '<b>' + socket.users + '</b>: ' + newmsg + '<br/>');
					console.log(('[User] ').gray.bold + socket.users + ': ' + msg);
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
		io.emit('shutdown', '<font color="#910000"><b>[Server]</b> The server has shut down</font><br/>');
		console.log(server + ' Shutting down...');
		process.exit();
	} else { // Anything else that's entered is sent as a server message
		io.emit('chat message', '<font color="#5E97FF"><b>[Server]</b> ' + input + '</font><br/>');
	}
});