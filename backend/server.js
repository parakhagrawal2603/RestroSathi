require('dotenv').config();
const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRestaurant', (restaurantId) => {
    socket.join(restaurantId);
    console.log(`Socket ${socket.id} joined restaurant ${restaurantId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const { startCronJobs } = require('./src/utils/cronJobs');
const initSuperAdmin = require('./src/utils/initSuperAdmin');

server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Initialize Super Admin if needed
  await initSuperAdmin();

  // Start automated background tasks (like order clearing)
  startCronJobs();
});

// Production Readiness: Graceful Shutdowns
const mongoose = require('mongoose');

const gracefulShutdown = () => {
  console.log('Received shutdown signal. Closing HTTP server & Database Connections...');
  
  // Close HTTP Server so no new requests are accepted
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      // Close Mongoose connections
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close(false);
        console.log('MongoDB connection closed.');
      }
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection', err);
      process.exit(1);
    }
  });

  // Force close after 10s if connections refuse to clear
  setTimeout(() => {
    console.error('Forcefully shutting down application after 10 seconds...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...', err);
  gracefulShutdown();
});
