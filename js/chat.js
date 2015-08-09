var socket = io(),
	username = $('#username'),
	btnLogin = $('#btnLogin'),
	btnRegister = $('#btnRegister'),
	btnSubmit = $('#btnSubmit'),
	regUsername = $('#regUsername'),
	regPassword = $('#regPassword'),
	regpasswordConfirm = $('#regpasswordConfirm'),
	txtUsername = $('#username'),
	txtPassword = $('#password'),
	loginform = $('#login'),
	registerForm = $('#registerForm'),
	chat = $('#chat'),
	chatbox = $('#chat-box'),
	reply = $('#reply'),
	textarea = $('#chat-textarea'),
	send = $('#send'),
	users = $('#online-users'),
	progBar = $('#progressbar'),
	salt,
	typeRegister,
	typeLogin,
	pHashed;

function login() {
	var loginDetails = { username : txtUsername.val(), password : txtPassword.val() }
	socket.emit('user login', loginDetails, function (data) {
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

function fadeOut() {
	reply.fadeOut("slow", function () { }); // So the user can no longer type
}

window.onfocus = function() {
	document.title = "ChatProject";
}

$.extend({
	playSound: function(){
		return $("<embed src='"+arguments[0]+".mp3' hidden='true' autostart='true' loop='false' height='0' width='0' class='playSound'>" + "<audio autoplay='autoplay' style='display:none;' controls='controls'><source src='"+arguments[0]+".mp3' /><source src='"+arguments[0]+".ogg' /></audio>").appendTo('body');
	}
});

$(document).ready(function () {
	chat.hide(); // Hide the chat when the page is loaded
	registerForm.hide();
});

btnLogin.click(function () { // Clicking the send button
	login();
});

txtPassword.keypress(function (e) {
	if (e.which == 13) { // Pressing Enter
		login();
	}
});

btnRegister.click(function () {
	loginform.fadeOut("slow", function () {
		registerForm.fadeIn("slow", function () { }); // Fade into the chatbox
	});
});

btnSubmit.click(function () {
	var passLen = regPassword.val();
	if (!regPassword.val() == regpasswordConfirm.val()) {
		alert('Your passwords do not match');
	} else if (passLen.length < 2 || passLen.length > 20) {
		alert('Your password must be 3-20 characters long');
	} else {
		var registerDetails = { username: regUsername.val(), password: regPassword.val() }
		socket.emit('register', registerDetails, function (data) {
			if (data == 'success') {
				alert('Signup successful! You may now login');
				registerForm.fadeOut("slow", function () {
					loginform.fadeIn("slow", function () { });
				});
			} else {
				alert(data);
			}
		});
	}
});

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

	if (chat.is(":visible")) {
		if(vis() == true) {
			document.title = "ChatProject";
		} else {
			document.title = "[!] ChatProject";
			$.playSound('mp3/alert');
		}
	}
});

socket.on('usernames', function (data) {
	var html = '';
	for (var i = 0; i < data.length; i++) {
		html += data[i] + '<br/>';
	}
	users.html(html);
});

socket.on('disconnect', function (reason) { // Just in case someone's internet cuts out for a short amount of time
	textarea.html(""); // Clear the chat
	users.html(""); // Clear the userlist
	appendMessage('<font color="#5E97FF"><b>[Server]</b> You have been disconnected</font><br/>');
	fadeOut();
});

socket.on('load messages', function (msgs) {
	var txt = $("#chat-textarea");
	if (txt.text().indexOf("You have been disconnected") !== -1) { // This way, the messages won't load in if the user is still on the div chat
		appendMessage('<font color="#5E97FF"><b>[Server]</b> A connection has been made to the server, please reload the page</font><br/>')
		/*setTimeout(function(){ // Automatically reload the page?
			window.location.reload();
		}, 5000);*/
	} else {
		for (var i = msgs.length - 1; i >= 0; i--) {
			appendMessage(msgs[i].msg);
		}
	}
});