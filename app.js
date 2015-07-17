var express = require('express'),
	app = express(),
	http = require('http').Server(app),
	io = require('socket.io')(http),
	port = Number(process.env.PORT || 3000),
	colors = require('colors'),
	server = '[Server]'.white.bold,
	users = [];

app.use('/images', express.static('images'));
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
app.get('/', function (req, res) {
	res.sendFile(__dirname + '/chat.html');
});

io.on('connection', function (socket) {
	socket.on('new user', function (data, callback) {
		var user = /^[\w]{1,15}$/; // Username can only contain letters, numbers and can be 1-15 characters long
		if (users.indexOf(data) != -1) { // Username is already taken
			callback(false);
		} else if (data == null) { // No username was entered
			callback(false);
		} else if (!user.test(data)){ // Username has invalid characters
			callback(false);
		} else {
			callback(true);
			socket.users = data;
			users.push(socket.users);
			console.log(server + ' New User: ' + data);
			io.emit('chat message', '<font color="#5E97FF"><b>[Server]</b> ' + data + ' has joined</font><br/>');
		}
	});

socket.on('disconnect', function () {
	if (!socket.users) return;
	users.splice(users.indexOf(socket.users), 1); // Remove user from list
	console.log(server + ' User Left: ' + socket.users);
	io.emit('chat message', '<font color="#4E7ACC"><b>[Server]</b> ' + socket.users + ' has left<br/>');
});

socket.on('chat message', function (msg) {
	if (!msg == "") {
		io.emit('chat message', '<b>' + socket.users + '</b>: ' + msg + "<br/>");
		console.log(('[User] ').gray.bold + socket.users + ': ' + msg);
	}
});
});

http.listen(port, function () {
	console.log(server + ' listening @ localhost:' + port);
});