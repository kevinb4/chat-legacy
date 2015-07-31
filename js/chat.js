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
		if (data == 'success') { // Have the server check if the username is valid
			loginform.fadeOut("slow", function () {
				chat.fadeIn("slow", function () { }); // Fade into the chatbox
				chatbox.scrollTop($(chatbox).get(0).scrollHeight); // Scroll to the bottom
			});
		} else {
			alert(data);
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

function appendMessage(msg) {
	var scrollpos = (chatbox).scrollTop(),
		scrolltotal = chatbox.prop('scrollHeight'),
		bottom = scrolltotal - scrollpos;

	textarea.append(msg); // Show message
	chatbox.perfectScrollbar('update');
	$('[data-toggle="tooltip"]').tooltip(); // For full timestamp
	if (bottom == 400) { // Check to see if the scroll bar is at the bottom
		chatbox.scrollTop($(chatbox).get(0).scrollHeight); // Scroll to the bottom
		chatbox.perfectScrollbar('update');
	}
}

send.click(function () { // Clicking the send button
	sendMessage();
});

reply.keypress(function (e) { // Checks for keys being pressed
	if (e.which == 13) { // Pressing Enter
		sendMessage();
	}
});

var vis = (function(){
	var stateKey, eventKey, keys = {
		hidden: "visibilitychange",
		webkitHidden: "webkitvisibilitychange",
		mozHidden: "mozvisibilitychange",
		msHidden: "msvisibilitychange"
	};
	for (stateKey in keys) {
		if (stateKey in document) {
			eventKey = keys[stateKey];
			break;
		}
	}
	return function(c) {
		if (c) document.addEventListener(eventKey, c);
		return !document[stateKey];
	}
})();

socket.on('chat message', function (msg) {
	appendMessage(msg);

	if(vis() == true)
		document.title = "ChatProject";
	else
		document.title = "[!] ChatProject";

});

window.onfocus = function() {
	document.title = "ChatProject";
}

socket.on('usernames', function (data) {
	var html = '';
	for (var i = 0; i < data.length; i++) {
		html += data[i] + '<br/>'
	}
	users.html(html);
});

socket.on('disconnect', function () { // Just in case someone's internet cuts out for a short amount of time
	textarea.html(""); // Clear the chat
	users.html(""); // Clear the userlist
	appendMessage('<font color="#5E97FF"><b>[Server]</b> You have been disconnected</font><br/>');
	fadeOut();
});

socket.on('load messages', function (msgs) {
	for (var i = msgs.length - 1; i >= 0; i--) {
		appendMessage(msgs[i].msg);
	}
});

function fadeOut() {
	reply.fadeOut("slow", function () { }); // So the user can no longer type
}