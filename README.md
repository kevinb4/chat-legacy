#Chat
This is a basic chat that will be improved over time... check out the ToDo list below.

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

#Test Server
A test server has been setup here http://chatproject.ddns.net:3000/

#ToDo List
- [x] Remake UI/Rewrite code from socket.io tutorial
- [x] Add usernames
- [x] Add HTML prevention
- [x] Add server commands (command: shutdown)
- [x] Add server messages from cmd
- [x] Add userlist
- [x] Add database (to save chat logs)
- [x] Add clickable links
- [ ] Add status (user idle, user is typing..., etc)
- [ ] Add notifcations
- [ ] Add formatting
- [ ] Add timestamp
- [ ] Add 'read messages'
- [ ] Add edit previous message feature
- [ ] Add commands
- [ ] Add Admin/Mod roles
- [ ] Add colored usernames
- [ ] Add a custom scrollbar
- [ ] Disable auto-scroll if the user is scrolled up
- [ ] Write a client in VB.net
- [ ] Write an andriod app