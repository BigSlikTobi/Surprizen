import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { initFirestore } from './config/initFirestore';
import { WebSocketService } from './services/websocketService';
import { SchedulingService } from './services/schedulingService';

// Load environment variables
dotenv.config();

// Create Express server
const app = express();

// Create HTTP server for WebSocket support
const httpServer = createServer(app);

// Set port
const PORT = process.env.PORT || 3001;

// Initialize services
const webSocketService = new WebSocketService();
const schedulingService = new SchedulingService();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: [
    'http://localhost:19006',  // Expo web default
    'http://localhost:8081',   // Alternative Expo web port
    'http://localhost:3000',   // React dev server
    'http://localhost:19000',  // Expo dev tools
  ],
  credentials: true,
}));
// Temporarily disable helmet for testing
// app.use(helmet());
app.use(morgan('dev'));

// Welcome route
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Welcome to Surprizen API',
    services: {
      websocket: 'enabled',
      scheduling: 'enabled',
      realTimeUpdates: 'enabled',
    },
    timestamp: new Date().toISOString(),
  });
});

// Service status routes
app.get('/api/v1/status/websocket', (_req, res) => {
  res.json({
    success: true,
    data: webSocketService.getStats(),
  });
});

app.get('/api/v1/status/scheduling', (_req, res) => {
  res.json({
    success: true,
    data: schedulingService.getStatus(),
  });
});

// API Routes
app.use(routes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize WebSocket service
webSocketService.initialize(httpServer);

// Start server
const server = httpServer.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
  console.info('WebSocket service initialized');
  
  // Start scheduling service
  schedulingService.start();
  console.info('Scheduling service started');
  
  // Initialize Firestore (but don't block server startup)
  initFirestore().catch(err => {
    console.error('Failed to initialize Firestore:', err);
    console.log('API will continue to function without Firestore');
  });
});

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  
  // Stop scheduling service
  schedulingService.stop();
  console.log('Scheduling service stopped');
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  gracefulShutdown('Unhandled Promise Rejection');
});

// Export services for use in other modules
export { webSocketService, schedulingService };
export default app;