const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

let activeRooms = {}; 

app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);

        if (!activeRooms[room]) {
            activeRooms[room] = [];
        }

        activeRooms[room].push(username);

        socket.emit('message', {
            username: 'System',
            message: 'Welcome to the community',
            timestamp: new Date().toLocaleTimeString()
        });

        socket.broadcast.to(room).emit('message', {
            username: 'System',
            message: `${username} has joined the chat`,
            timestamp: new Date().toLocaleTimeString()
        });

        io.to(room).emit('activeUsers', activeRooms[room]);
        io.emit('activeRooms', Object.keys(activeRooms));

        socket.on('chatMessage', (data) => {
            io.to(room).emit('message', {
                username: data.username,
                message: data.message,
                timestamp: data.timestamp
            });
        });

        socket.on('typing', (username) => {
            socket.broadcast.to(room).emit('typing', { username });
        });

        socket.on('stopTyping', () => {
            socket.broadcast.to(room).emit('stopTyping');
        });

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

            io.to(room).emit('activeUsers', activeRooms[room] || []);
            io.emit('activeRooms', Object.keys(activeRooms));
        });
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
