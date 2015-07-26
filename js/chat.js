var socket = io(),
		username = $('#username'),
		set = $('#set'),
		loginform = $('#login'),
		chat = $('#chat'),
		chatbox = $('#chat-box'),
		reply = $('#reply'),
		textarea = $('#chat-textarea'),
		send = $('#send'),
		users = $('#online-users');

$(document).ready(function () {
	chat.hide(); // Hide the chat when the page is loaded
});

function login() {
	socket.emit('new user', username.val(), function (data) {
		if (data) { // Have the server check if the username is valid
			loginform.fadeOut("slow", function () {
				chat.fadeIn("slow", function () { }); // Fade into the chatbox
			});
		} else {
			alert('There is something wrong with your username. Please check the following:\r\n-You entered a username\r\n-Your username can only contain letters and numbers (1-15 characters long)\r\n-Someone else already has that username\r\n-You are already logged in (on the same IP address)');
		}
	});
}

set.click(function () { // Clicking the send button
	login();
});

username.keypress(function (e) {
	if (e.which == 13) { // Pressing Enter
		login();
	}
});

function sendMessage() {
	socket.emit('chat message', reply.val()); // Emit the message
	reply.val(""); // Clear the reply box
}

send.click(function () { // Clicking the send button
	sendMessage();
});

reply.keypress(function (e) { // Checks for keys being pressed
	if (e.which == 13) { // Pressing Enter
		sendMessage();
	}
});

socket.on('chat message', function (msg) { // When a message is emitted...
	textarea.append(msg); // ...the message is shown in the chatbox
	chatbox.scrollTop($(chatbox).get(0).scrollHeight); // Scroll down
});

socket.on('usernames', function (data) {
	var html = '';
	for (i = 0; i < data.length; i++) {
		html += data[i] + '<br/>'
	}
	users.html(html);
});

socket.on('shutdown', function (smsg) {
	textarea.append(smsg); // Send shutdown message
	fadeOut();
});

socket.on('disconnect', function () { // Just in case someone's internet cuts out for a short amount of time
	fadeOut();
});

function fadeOut() {
	reply.fadeOut("slow", function () { }); // So the user can no longer type
}