var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	port = Number(process.env.PORT || 3000),
	colors = require('colors'),
	server = '[Server]'.white.bold,
	users = [],
	ips = [];

app.use('/images', express.static('images'));
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/chat.html');
});

io.on('connection', function (socket) {
	socket.on('new user', function (data, callback) {
		var user = /^[\w]{1,15}$/; // Username can only contain letters, numbers and can be 1-15 characters long
		var userip = getIPAddresses().toString().trim();
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
			console.log(server + ' New User: ' + data + ' - IP: ' + userip);
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
		io.sockets.emit('usernames', users);
	}

	socket.on('chat message', function (msg) {
		if (!msg == "") {
			if (!socket.users == "") {
				if (msg.indexOf("<")) {
					io.emit('chat message', '<b>' + socket.users + '</b>: ' + msg + '<br/>');
					console.log(('[User] ').gray.bold + socket.users + ': ' + msg);
				} else {
					var newmsg = msg.replace(/</g, '&lt;');
					io.emit('chat message', '<b>' + socket.users + '</b>: ' + newmsg + '<br/>');
					console.log(('[User] ').gray.bold + socket.users + ': ' + msg);
				}
			}
		}
	});

	function getIPAddresses() { // When using a no-ip service, this gets the wrong IP, but can still be useful for detecting the same ip

		var ipAddresses = [];

		var interfaces = require('os').networkInterfaces();
		for (var devName in interfaces) {
			var iface = interfaces[devName];
			for (var i = 0; i < iface.length; i++) {
				var alias = iface[i];
				if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
					ipAddresses.push(alias.address);
				}
			}
		}

		return ipAddresses;
	}
});

var stdin = process.stdin, stdout = process.stdout;

stdin.resume();
stdin.on('data', function (data) {
	var input = data.toString().trim();
	if (input == 'shutdown') {
		io.emit('shutdown', '<font color="#910000"><b>[Server]</b> The server has shut down</font><br/>');
		console.log(server + ' Shutting down...');
		process.exit();
	} else {
		io.emit('chat message', '<font color="#5E97FF"><b>[Server]</b> ' + input + '</font><br/>');
	}
});

http.listen(port, function () {
	console.log(server + ' listening @ localhost:' + port);
});