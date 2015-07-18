var socket = io(),
		username = $('#username'),
		set = $('#set'),
		form = $('#login'),
		chat = $('#chat'),
		chatbox = $('#chat-box'),
		reply = $('#reply'),
		textarea = $('#chat-textarea'),
		send = $('#send');

$(document).ready(function () {
	chat.hide(); // Hide the chat when the page is loaded
});

function login() {
    socket.emit('new user', username.val(), function (data) {
        if (data) { // Have the server check if the username is valid
            form.fadeOut("slow", function () {
                chat.fadeIn("slow", function () { }); // Fade into the chatbox
            });
        } else {
            alert('There is something wrong with your username. Please check the following:\r\n-You entered a username\r\n-Your username can only contain letters and numbers (1-20 characters long)\r\n-Someone else already has that username');
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

socket.on('shutdown', function (smsg) {
	textarea.append(smsg); // Send shutdown message
	reply.fadeOut("slow", function () { }); // So the user can no longer type
});