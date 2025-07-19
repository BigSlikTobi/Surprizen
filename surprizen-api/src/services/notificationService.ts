import { Experience } from '../models/Experience';
import { Journey } from '../models/Journey';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  experienceDelivery: boolean;
  journeyUpdates: boolean;
  adaptationNotifications: boolean;
  quietHours?: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    timezone: string;
  };
}

export class NotificationService {
  private vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || '',
    privateKey: process.env.VAPID_PRIVATE_KEY || '',
  };

  /**
   * Send push notification for experience delivery
   */
  async sendExperienceNotification(
    experience: Experience,
    recipientName: string,
    pushSubscription?: PushSubscription
  ): Promise<boolean> {
    try {
      const payload: NotificationPayload = {
        title: '✨ You have a new surprise!',
        body: `${experience.content.title} - Tap to view your special moment`,
        data: {
          experienceId: experience.id,
          type: 'experience_delivery',
          journeyId: experience.journeyId,
        },
        imageUrl: experience.content.mediaUrl,
        actionUrl: `/experience/${experience.id}`,
      };

      // Send push notification if subscription is available
      if (pushSubscription) {
        await this.sendPushNotification(pushSubscription, payload);
      }

      // Log notification for debugging
      console.log(`Experience notification sent for ${experience.id}:`, {
        recipient: recipientName,
        title: payload.title,
        type: experience.type,
      });

      return true;
    } catch (error) {
      console.error('Error sending experience notification:', error);
      return false;
    }
  }

  /**
   * Send push notification for journey updates
   */
  async sendJourneyUpdateNotification(
    journey: Journey,
    updateType: 'started' | 'completed' | 'paused' | 'resumed',
    recipientName: string,
    pushSubscription?: PushSubscription
  ): Promise<boolean> {
    try {
      const messages = {
        started: {
          title: '🎁 Your journey has begun!',
          body: `${journey.title} - Get ready for some amazing surprises`,
        },
        completed: {
          title: '🎉 Journey completed!',
          body: `${journey.title} - Thank you for sharing this special experience`,
        },
        paused: {
          title: '⏸️ Journey paused',
          body: `${journey.title} - Your journey will resume soon`,
        },
        resumed: {
          title: '▶️ Journey resumed',
          body: `${journey.title} - More surprises are coming your way`,
        },
      };

      const message = messages[updateType];
      const payload: NotificationPayload = {
        title: message.title,
        body: message.body,
        data: {
          journeyId: journey.id,
          type: 'journey_update',
          updateType,
        },
        actionUrl: `/journey/${journey.id}`,
      };

      // Send push notification if subscription is available
      if (pushSubscription) {
        await this.sendPushNotification(pushSubscription, payload);
      }

      console.log(`Journey update notification sent for ${journey.id}:`, {
        recipient: recipientName,
        updateType,
        title: payload.title,
      });

      return true;
    } catch (error) {
      console.error('Error sending journey update notification:', error);
      return false;
    }
  }

  /**
   * Send adaptation notification to gift giver
   */
  async sendAdaptationNotification(
    journey: Journey,
    adaptationType: 'engagement_low' | 'engagement_high' | 'preference_learned',
    details: string,
    pushSubscription?: PushSubscription
  ): Promise<boolean> {
    try {
      const messages = {
        engagement_low: {
          title: '📊 Journey Insight',
          body: `${journey.recipient.name} seems less engaged. Consider adjusting the experience.`,
        },
        engagement_high: {
          title: '🎯 Great Success!',
          body: `${journey.recipient.name} is loving the experiences! Keep it up.`,
        },
        preference_learned: {
          title: '🧠 New Preference Discovered',
          body: `We learned something new about ${journey.recipient.name}'s preferences.`,
        },
      };

      const message = messages[adaptationType];
      const payload: NotificationPayload = {
        title: message.title,
        body: message.body,
        data: {
          journeyId: journey.id,
          type: 'adaptation_update',
          adaptationType,
          details,
        },
        actionUrl: `/dashboard/journey/${journey.id}`,
      };

      // Send push notification if subscription is available
      if (pushSubscription) {
        await this.sendPushNotification(pushSubscription, payload);
      }

      console.log(`Adaptation notification sent for ${journey.id}:`, {
        adaptationType,
        details,
      });

      return true;
    } catch (error) {
      console.error('Error sending adaptation notification:', error);
      return false;
    }
  }

  /**
   * Send push notification using Web Push API
   */
  private async sendPushNotification(
    subscription: PushSubscription,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      // In a real implementation, you would use a library like 'web-push'
      // For now, we'll simulate the push notification
      console.log('Sending push notification:', {
        endpoint: subscription.endpoint.substring(0, 50) + '...',
        payload: {
          title: payload.title,
          body: payload.body,
          data: payload.data,
        },
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      // Here you would typically:
      // const webpush = require('web-push');
      // webpush.setVapidDetails(
      //   'mailto:your-email@example.com',
      //   this.vapidKeys.publicKey,
      //   this.vapidKeys.privateKey
      // );
      // await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Check if notifications should be sent based on quiet hours
   */
  isQuietHour(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours) {
      return false;
    }

    try {
      const now = new Date();
      const timezone = preferences.quietHours.timezone || 'UTC';
      
      // Convert current time to recipient's timezone
      const recipientTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      const currentHour = recipientTime.getHours();
      const currentMinute = recipientTime.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      // Parse quiet hours
      const [startHour, startMinute] = preferences.quietHours.start.split(':').map(Number);
      const [endHour, endMinute] = preferences.quietHours.end.split(':').map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      // Handle overnight quiet hours (e.g., 22:00 to 08:00)
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime;
      } else {
        return currentTime >= startTime && currentTime <= endTime;
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  }

  /**
   * Schedule delayed notification if in quiet hours
   */
  async scheduleNotificationIfNeeded(
    notificationFn: () => Promise<boolean>,
    preferences: NotificationPreferences,
    delayMinutes: number = 60
  ): Promise<boolean> {
    if (this.isQuietHour(preferences)) {
      // Schedule notification for later
      setTimeout(async () => {
        try {
          await notificationFn();
        } catch (error) {
          console.error('Error sending delayed notification:', error);
        }
      }, delayMinutes * 60 * 1000);

      console.log(`Notification scheduled for ${delayMinutes} minutes due to quiet hours`);
      return true;
    } else {
      // Send immediately
      return await notificationFn();
    }
  }

  /**
   * Batch send notifications
   */
  async sendBatchNotifications(
    notifications: Array<{
      subscription: PushSubscription;
      payload: NotificationPayload;
    }>
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    const promises = notifications.map(async ({ subscription, payload }) => {
      try {
        await this.sendPushNotification(subscription, payload);
        successful++;
      } catch (error) {
        console.error('Batch notification failed:', error);
        failed++;
      }
    });

    await Promise.allSettled(promises);

    console.log(`Batch notifications sent: ${successful} successful, ${failed} failed`);
    return { successful, failed };
  }

  /**
   * Generate VAPID keys (for setup)
   */
  static generateVapidKeys(): { publicKey: string; privateKey: string } {
    // In a real implementation, you would use the web-push library:
    // const webpush = require('web-push');
    // return webpush.generateVAPIDKeys();
    
    // For now, return placeholder keys
    return {
      publicKey: 'BExample-Public-Key-Would-Go-Here',
      privateKey: 'Example-Private-Key-Would-Go-Here',
    };
  }

  /**
   * Validate push subscription
   */
  validatePushSubscription(subscription: any): subscription is PushSubscription {
    return (
      subscription &&
      typeof subscription.endpoint === 'string' &&
      subscription.keys &&
      typeof subscription.keys.p256dh === 'string' &&
      typeof subscription.keys.auth === 'string'
    );
  }
}