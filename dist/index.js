"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const UserManger_1 = require("./managers/UserManger");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}));
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://duomegle.vercel.app",
            "https://duomegle.netlify.app"
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});
const userManager = new UserManger_1.UserManager();
io.on('connection', (socket) => {
    console.log('👤 New connection:', socket.id);
    socket.on('join', ({ name }) => {
        console.log('🎉 User joined:', name, '(ID:', socket.id, ')');
        userManager.addUser(name, socket);
        console.log('👥 Current queue length:', userManager.queue.length);
    });
    socket.on('chat-message', ({ message, roomId }) => {
        console.log('Chat message:', message, 'in room:', roomId);
        userManager.roomManager.sendChatMessage(roomId, socket.id, message);
    });
    socket.on('find-next', () => {
        console.log('User requested next:', socket.id);
        const otherUser = userManager.roomManager.removeUserFromRoom(socket.id);
        if (otherUser) {
            userManager.addToQueue(otherUser.socket.id);
        }
        const currentUser = userManager.users.get(socket.id);
        if (currentUser) {
            userManager.addToQueue(socket.id);
        }
    });
    socket.on('offer', ({ sdp, roomId }) => {
        console.log('Received offer for room:', roomId);
        const room = userManager.roomManager.getRoom(roomId);
        if (!room)
            return;
        const otherUser = room.user1.socket.id === socket.id ? room.user2 : room.user1;
        otherUser.socket.emit('offer', { sdp, roomId });
    });
    socket.on('answer', ({ sdp, roomId }) => {
        console.log('Received answer for room:', roomId);
        const room = userManager.roomManager.getRoom(roomId);
        if (!room)
            return;
        const otherUser = room.user1.socket.id === socket.id ? room.user2 : room.user1;
        otherUser.socket.emit('answer', { sdp, roomId });
    });
    socket.on('add-ice-candidate', ({ candidate, roomId, type }) => {
        console.log('Ice candidate:', type, 'for room:', roomId);
        const room = userManager.roomManager.getRoom(roomId);
        if (!room)
            return;
        const otherUser = room.user1.socket.id === socket.id ? room.user2 : room.user1;
        otherUser.socket.emit('add-ice-candidate', { candidate, type, roomId });
    });
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        const otherUser = userManager.roomManager.removeUserFromRoom(socket.id);
        if (otherUser) {
            userManager.addToQueue(otherUser.socket.id);
        }
        userManager.removeUser(socket.id);
    });
});
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map