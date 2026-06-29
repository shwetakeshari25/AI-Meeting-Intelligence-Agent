const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with Fallback Mode
let isMongoDBConnected = false;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aimeeting';

console.log('Attempting to connect to MongoDB...');
mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000 // Timeout after 5 seconds instead of hanging
})
.then(() => {
    isMongoDBConnected = true;
    console.log('MongoDB successfully connected!');
})
.catch((err) => {
    console.warn('\n================================================================');
    console.warn('WARNING: Could not connect to MongoDB.');
    console.warn('Reason:', err.message);
    console.warn('FALLBACK: The server will run in MEMORY-STORE mode.');
    console.warn('All signup, login, meetings, and task changes will work but');
    console.warn('will reset when the server restarts.');
    console.warn('================================================================\n');
});

// Attach database connection status to requests
app.use((req, res, next) => {
    req.isDbConnected = isMongoDBConnected;
    next();
});

// Import Routes
const authRoutes = require('./routes/auth');
const meetingRoutes = require('./routes/meetings');
const taskRoutes = require('./routes/tasks');
const analyticsRoutes = require('./routes/analytics');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);

// Base route
app.use('/', (req, res) => {
    res.json({
        name: 'AI Meeting Intelligent API',
        status: 'online',
        databaseMode: req.isDbConnected ? 'MongoDB Connected' : 'Memory Store Fallback Mode'
    });
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// WebSocket Server for WebRTC signaling
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const rooms = new Map();

wss.on('connection', (ws) => {
    let currentRoom = null;
    let currentUser = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            switch (data.type) {
                case 'join':
                    currentRoom = data.meetingId;
                    currentUser = data.userId || 'anonymous';
                    if (!rooms.has(currentRoom)) {
                        rooms.set(currentRoom, new Set());
                    }
                    ws.userId = currentUser;
                    rooms.get(currentRoom).add(ws);
                    
                    // Notify others in room
                    rooms.get(currentRoom).forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'peer-joined',
                                userId: currentUser
                            }));
                        }
                    });
                    console.log(`User ${currentUser} joined room ${currentRoom} via WebSocket`);
                    break;
                case 'signal':
                    if (currentRoom && rooms.has(currentRoom)) {
                        rooms.get(currentRoom).forEach(client => {
                            if (client !== ws && client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({
                                    type: 'signal',
                                    sender: currentUser,
                                    signal: data.signal
                                }));
                            }
                        });
                    }
                    break;
                case 'leave':
                    handleLeave();
                    break;
            }
        } catch (e) {
            console.error('WS Error processing message:', e);
        }
    });

    const handleLeave = () => {
        if (currentRoom && rooms.has(currentRoom)) {
            const roomClients = rooms.get(currentRoom);
            roomClients.delete(ws);
            roomClients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'peer-left',
                        userId: currentUser
                    }));
                }
            });
            if (roomClients.size === 0) {
                rooms.delete(currentRoom);
            }
            console.log(`User ${currentUser} left room ${currentRoom}`);
        }
    };

    ws.on('close', () => {
        handleLeave();
    });
});

