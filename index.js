var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    port = Number(process.env.PORT || 3000);

app.use('/images', express.static('images'));
app.use('/css', express.static('css'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
    console.log('Server: a user connected');
    io.emit('chat message', 'Server: a user connected<br/>');
    socket.on('disconnect', function () {
        console.log('Server: user disconnected');
        io.emit('chat message', 'Server: a user disconnected<br/>');
    });
});

io.on('connection', function (socket) {
    socket.on('chat message', function (msg) {
        if (!msg == "") {
            io.emit('chat message', 'User: ' + msg + "<br/>");
            console.log('User: ' + msg);
        }
    });
});

http.listen(port, function () {
    console.log('Server: listening @ localhost:' + port);
});