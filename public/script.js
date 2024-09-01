const socket = io();

document.getElementById('joinButton').addEventListener('click', () => {
    const username = document.getElementById('username').value;
    const room = document.getElementById('room').value;
    
    if (username && room) {
        socket.emit('joinRoom', { username, room });
    }
});

document.getElementById('sendMessageButton').addEventListener('click', () => {
    const message = document.getElementById('messageInput').value;
    const username = document.getElementById('username').value;
    if (message) {
        const timestamp = new Date().toLocaleTimeString();
        addMessage(username, message, true, timestamp); 
        socket.emit('chatMessage', { username, message, timestamp });
        document.getElementById('messageInput').value = '';
    }
});

socket.on('message', (data) => {
    addMessage(data.username, data.message, false, data.timestamp);  
});

socket.on('typing', (data) => {
    document.getElementById('typingStatus').innerText = `${data.username} is typing...`;
});

socket.on('stopTyping', () => {
    document.getElementById('typingStatus').innerText = '';
});

socket.on('activeUsers', (users) => {
    document.getElementById('activeUsers').innerText = `Active Users: ${users.join(', ')}`;
});

socket.on('activeRooms', (rooms) => {
    document.getElementById('activeRooms').innerText = `Active Rooms: ${rooms.join(', ')}`;
});

function addMessage(username, content, isCurrentUser, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isCurrentUser ? 'message current-user' : 'message other-user';
    messageDiv.innerHTML = `<p class="username">${username}:</p><p>${content}</p><span class="timestamp">${timestamp}</span>`;
    
    const messages = document.getElementById('messages').children;
    for (const msg of messages) {
        if (msg.innerHTML === messageDiv.innerHTML) {
            msg.remove();
        }
    }
    
    document.getElementById('messages').appendChild(messageDiv);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}
