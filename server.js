const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

let activeRooms = {};  // Store active rooms and their users

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to render the index.ejs file
app.get('/', (req, res) => {
    res.render('index');
});

// Handle a socket connection request from a web client
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);

        if (!activeRooms[room]) {
            activeRooms[room] = [];
        }

        activeRooms[room].push(username);

        // Send a welcome message to the user who just joined
        socket.emit('message', {
            username: 'System',
            message: 'Welcome to the community',
            timestamp: new Date().toLocaleTimeString()
        });

        // Broadcast when a user connects to the room
        socket.broadcast.to(room).emit('message', {
            username: 'System',
            message: `${username} has joined the chat`,
            timestamp: new Date().toLocaleTimeString()
        });

        // Update active users and rooms
        io.to(room).emit('activeUsers', activeRooms[room]);
        io.emit('activeRooms', Object.keys(activeRooms));

        // Listen for chatMessage
        socket.on('chatMessage', (data) => {
            io.to(room).emit('message', {
                username: data.username,
                message: data.message,
                timestamp: data.timestamp
            });
        });

        // Listen for typing event
        socket.on('typing', (username) => {
            socket.broadcast.to(room).emit('typing', { username });
        });

        socket.on('stopTyping', () => {
            socket.broadcast.to(room).emit('stopTyping');
        });

        // Runs when client disconnects
        socket.on('disconnect', () => {
            if (activeRooms[room]) {
                activeRooms[room] = activeRooms[room].filter(user => user !== username);
                if (activeRooms[room].length === 0) {
                    delete activeRooms[room];
                }
            }

            io.to(room).emit('message', {
                username: 'System',
                message: `${username} has left the chat`,
                timestamp: new Date().toLocaleTimeString()
            });

            // Update active users and rooms
            io.to(room).emit('activeUsers', activeRooms[room] || []);
            io.emit('activeRooms', Object.keys(activeRooms));
        });
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
