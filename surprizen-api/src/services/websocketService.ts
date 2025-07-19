import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Experience } from '../models/Experience';
import { Journey } from '../models/Journey';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
  recipientId?: string;
  journeyId?: string;
}

export interface ConnectedClient {
  socketId: string;
  userId?: string;
  recipientId?: string;
  journeyId?: string;
  connectedAt: Date;
  lastActivity: Date;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private recipientSockets: Map<string, Set<string>> = new Map(); // recipientId -> socketIds

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: [
          'http://localhost:19006',  // Expo web default
          'http://localhost:8081',   // Alternative Expo web port
          'http://localhost:3000',   // React dev server
          'http://localhost:19000',  // Expo dev tools
        ],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
    console.log('WebSocket service initialized');
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle client authentication
      socket.on('authenticate', (data: { userId?: string; recipientId?: string; journeyId?: string }) => {
        this.authenticateClient(socket.id, data);
      });

      // Handle experience status updates
      socket.on('experience_status', (data: { experienceId: string; status: string; timeSpent?: number }) => {
        this.handleExperienceStatusUpdate(socket.id, data);
      });

      // Handle real-time reactions
      socket.on('experience_reaction', (data: { experienceId: string; reaction: any }) => {
        this.handleExperienceReaction(socket.id, data);
      });

      // Handle journey updates
      socket.on('journey_update', (data: { journeyId: string; update: any }) => {
        this.handleJourneyUpdate(socket.id, data);
      });

      // Handle heartbeat for connection monitoring
      socket.on('heartbeat', () => {
        this.updateClientActivity(socket.id);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
        this.removeClient(socket.id);
      });

      // Add client to connected clients
      this.addClient(socket.id);
    });
  }

  /**
   * Authenticate client and associate with user/recipient
   */
  private authenticateClient(socketId: string, data: { userId?: string; recipientId?: string; journeyId?: string }): void {
    const client = this.connectedClients.get(socketId);
    if (!client) return;

    // Update client information
    client.userId = data.userId;
    client.recipientId = data.recipientId;
    client.journeyId = data.journeyId;
    client.lastActivity = new Date();

    // Update user socket mapping
    if (data.userId) {
      if (!this.userSockets.has(data.userId)) {
        this.userSockets.set(data.userId, new Set());
      }
      this.userSockets.get(data.userId)!.add(socketId);
    }

    // Update recipient socket mapping
    if (data.recipientId) {
      if (!this.recipientSockets.has(data.recipientId)) {
        this.recipientSockets.set(data.recipientId, new Set());
      }
      this.recipientSockets.get(data.recipientId)!.add(socketId);
    }

    console.log(`Client authenticated: ${socketId}`, {
      userId: data.userId,
      recipientId: data.recipientId,
      journeyId: data.journeyId,
    });

    // Send authentication confirmation
    this.sendToSocket(socketId, {
      type: 'authentication_success',
      data: { authenticated: true },
      timestamp: new Date(),
    });
  }

  /**
   * Handle experience status updates
   */
  private handleExperienceStatusUpdate(
    socketId: string,
    data: { experienceId: string; status: string; timeSpent?: number }
  ): void {
    const client = this.connectedClients.get(socketId);
    if (!client) return;

    console.log(`Experience status update from ${socketId}:`, data);

    // Broadcast to journey owner if this is a recipient update
    if (client.recipientId && client.journeyId) {
      this.broadcastToJourneyOwner(client.journeyId, {
        type: 'experience_status_update',
        data: {
          experienceId: data.experienceId,
          status: data.status,
          timeSpent: data.timeSpent,
          recipientId: client.recipientId,
        },
        timestamp: new Date(),
        recipientId: client.recipientId,
        journeyId: client.journeyId,
      });
    }

    this.updateClientActivity(socketId);
  }

  /**
   * Handle experience reactions
   */
  private handleExperienceReaction(
    socketId: string,
    data: { experienceId: string; reaction: any }
  ): void {
    const client = this.connectedClients.get(socketId);
    if (!client) return;

    console.log(`Experience reaction from ${socketId}:`, data);

    // Broadcast to journey owner
    if (client.recipientId && client.journeyId) {
      this.broadcastToJourneyOwner(client.journeyId, {
        type: 'experience_reaction',
        data: {
          experienceId: data.experienceId,
          reaction: data.reaction,
          recipientId: client.recipientId,
        },
        timestamp: new Date(),
        recipientId: client.recipientId,
        journeyId: client.journeyId,
      });
    }

    this.updateClientActivity(socketId);
  }

  /**
   * Handle journey updates
   */
  private handleJourneyUpdate(
    socketId: string,
    data: { journeyId: string; update: any }
  ): void {
    const client = this.connectedClients.get(socketId);
    if (!client) return;

    console.log(`Journey update from ${socketId}:`, data);

    // Broadcast to all clients connected to this journey
    this.broadcastToJourney(data.journeyId, {
      type: 'journey_update',
      data: data.update,
      timestamp: new Date(),
      journeyId: data.journeyId,
    }, socketId); // Exclude sender

    this.updateClientActivity(socketId);
  }

  /**
   * Send experience delivery notification
   */
  sendExperienceDelivery(experience: Experience): void {
    const message: WebSocketMessage = {
      type: 'experience_delivered',
      data: {
        experience,
        deliveredAt: new Date(),
      },
      timestamp: new Date(),
      recipientId: experience.recipientId,
      journeyId: experience.journeyId,
    };

    // Send to recipient
    this.sendToRecipient(experience.recipientId, message);

    // Send to journey owner
    this.broadcastToJourneyOwner(experience.journeyId, {
      ...message,
      type: 'experience_delivery_confirmed',
    });
  }

  /**
   * Send journey status update
   */
  sendJourneyStatusUpdate(journey: Journey, updateType: string): void {
    const message: WebSocketMessage = {
      type: 'journey_status_update',
      data: {
        journey,
        updateType,
        updatedAt: new Date(),
      },
      timestamp: new Date(),
      journeyId: journey.id,
    };

    // Send to all clients connected to this journey
    this.broadcastToJourney(journey.id, message);
  }

  /**
   * Send adaptation notification
   */
  sendAdaptationNotification(
    journeyId: string,
    adaptationType: string,
    data: any
  ): void {
    const message: WebSocketMessage = {
      type: 'adaptation_notification',
      data: {
        adaptationType,
        ...data,
      },
      timestamp: new Date(),
      journeyId,
    };

    // Send to journey owner
    this.broadcastToJourneyOwner(journeyId, message);
  }

  /**
   * Send message to specific socket
   */
  private sendToSocket(socketId: string, message: WebSocketMessage): void {
    if (!this.io) return;

    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('message', message);
    }
  }

  /**
   * Send message to user (all their connected sockets)
   */
  private sendToUser(userId: string, message: WebSocketMessage): void {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.sendToSocket(socketId, message);
      });
    }
  }

  /**
   * Send message to recipient (all their connected sockets)
   */
  private sendToRecipient(recipientId: string, message: WebSocketMessage): void {
    const socketIds = this.recipientSockets.get(recipientId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.sendToSocket(socketId, message);
      });
    }
  }

  /**
   * Broadcast to journey owner
   */
  private broadcastToJourneyOwner(journeyId: string, message: WebSocketMessage): void {
    // Find clients connected to this journey who are journey owners (have userId)
    this.connectedClients.forEach((client, socketId) => {
      if (client.journeyId === journeyId && client.userId) {
        this.sendToSocket(socketId, message);
      }
    });
  }

  /**
   * Broadcast to all clients connected to a journey
   */
  private broadcastToJourney(journeyId: string, message: WebSocketMessage, excludeSocketId?: string): void {
    this.connectedClients.forEach((client, socketId) => {
      if (client.journeyId === journeyId && socketId !== excludeSocketId) {
        this.sendToSocket(socketId, message);
      }
    });
  }

  /**
   * Add new client
   */
  private addClient(socketId: string): void {
    const client: ConnectedClient = {
      socketId,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.connectedClients.set(socketId, client);
  }

  /**
   * Remove client and clean up mappings
   */
  private removeClient(socketId: string): void {
    const client = this.connectedClients.get(socketId);
    if (!client) return;

    // Remove from user sockets mapping
    if (client.userId) {
      const userSockets = this.userSockets.get(client.userId);
      if (userSockets) {
        userSockets.delete(socketId);
        if (userSockets.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
    }

    // Remove from recipient sockets mapping
    if (client.recipientId) {
      const recipientSockets = this.recipientSockets.get(client.recipientId);
      if (recipientSockets) {
        recipientSockets.delete(socketId);
        if (recipientSockets.size === 0) {
          this.recipientSockets.delete(client.recipientId);
        }
      }
    }

    // Remove from connected clients
    this.connectedClients.delete(socketId);
  }

  /**
   * Update client activity timestamp
   */
  private updateClientActivity(socketId: string): void {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.lastActivity = new Date();
    }
  }

  /**
   * Get service statistics
   */
  getStats(): {
    connectedClients: number;
    authenticatedUsers: number;
    authenticatedRecipients: number;
    activeJourneys: number;
  } {
    const authenticatedUsers = new Set();
    const authenticatedRecipients = new Set();
    const activeJourneys = new Set();

    this.connectedClients.forEach(client => {
      if (client.userId) authenticatedUsers.add(client.userId);
      if (client.recipientId) authenticatedRecipients.add(client.recipientId);
      if (client.journeyId) activeJourneys.add(client.journeyId);
    });

    return {
      connectedClients: this.connectedClients.size,
      authenticatedUsers: authenticatedUsers.size,
      authenticatedRecipients: authenticatedRecipients.size,
      activeJourneys: activeJourneys.size,
    };
  }

  /**
   * Clean up inactive connections
   */
  cleanupInactiveConnections(inactiveThresholdMinutes: number = 30): void {
    const threshold = new Date(Date.now() - inactiveThresholdMinutes * 60 * 1000);
    const inactiveClients: string[] = [];

    this.connectedClients.forEach((client, socketId) => {
      if (client.lastActivity < threshold) {
        inactiveClients.push(socketId);
      }
    });

    inactiveClients.forEach(socketId => {
      console.log(`Cleaning up inactive connection: ${socketId}`);
      if (this.io) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
      }
      this.removeClient(socketId);
    });

    if (inactiveClients.length > 0) {
      console.log(`Cleaned up ${inactiveClients.length} inactive connections`);
    }
  }
}