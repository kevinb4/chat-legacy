#Legacy
After a few months of working on the chat here and there, I have modifed way too much to pull into one commit, or even small commits. I have decided to clean the code a bit and make a fresh start. Though, the main reason for this change is that the new chat isn't compatible with the legacy chat.

#Chat
This is a basic chat that will be improved over time... check out the ToDo list below.

#Test Server
A test server has been setup here http://chatproject.noip.me:3000/

#Requirements
- Node.js must be installed (found here http://nodejs.org/)
- MongoDB must be installed and running (found here https://www.mongodb.org/)

#Setting up MongoDB
1. Install MongoDB
2. Open CMD and navigate to the bin directory (might look like C:\Program Files\MongoDB\Server\3.0\bin)
3. Execute `mongod.exe --dbpath "...\chat\db"`

You can also make a batch file with the following (the `...` being the path that leads to the respective directories)

```
cd "...\MongoDB\Server\3.0\bin\"
start mongod.exe --dbpath "...\chat\db"
```

MongoDB should now be running. If you run into any issues, refer to MongoDB's docs.

#Github Errors
If you are getting "Filename is too long" error, run `git config --system core.longpaths true` in git shell.

#ToDo List
- [x] Remake UI/Rewrite code from socket.io tutorial
- [x] Add usernames
- [x] Add HTML prevention
- [x] Add server commands
- [x] Add user commands
- [x] Add server messages from cmd
- [x] Add userlist
- [x] Add database (to save chat logs)
- [x] Add clickable links
- [x] Add whisper function (user command)
- [x] Add timestamp
- [x] Add a custom scrollbar
- [x] Add gitter-like notifcation
- [x] Add Admin/Mod roles
- [x] Add login system
- [x] Add sound notifications
- [x] Add "edit previous message" feature
- [ ] Add an options menu
- [ ] Add status (user idle, user is typing..., etc)
- [ ] Add formatting
- [ ] Write a client in VB.net
- [ ] Write an andriod app
