import { ExperienceModel, Experience } from '../models/Experience';
import { JourneyModel, Journey } from '../models/Journey';
import { MockDataService } from './mockDataService';
import { ContentGenerationService } from './contentGenerationService';

export interface ScheduledTask {
  id: string;
  type: 'experience_delivery' | 'status_check' | 'adaptation_analysis';
  scheduledTime: Date;
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export class SchedulingService {
  private experienceModel = new ExperienceModel();
  private journeyModel = new JourneyModel();
  private contentGeneration = new ContentGenerationService();
  private scheduledTasks = new Map<string, NodeJS.Timeout>();
  private backgroundInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private useMockData = false;

  constructor() {
    // Initialize mock data for development
    MockDataService.initialize();
  }

  /**
   * Start the background scheduling service
   */
  start(): void {
    if (this.isRunning) {
      console.log('Scheduling service is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting scheduling service...');

    // Run background tasks every 30 minutes
    this.backgroundInterval = setInterval(() => {
      this.runBackgroundTasks();
    }, 30 * 60 * 1000); // 30 minutes

    // Run initial background tasks
    this.runBackgroundTasks();

    console.log('Scheduling service started successfully');
  }

  /**
   * Stop the background scheduling service
   */
  stop(): void {
    if (!this.isRunning) {
      console.log('Scheduling service is not running');
      return;
    }

    this.isRunning = false;
    console.log('Stopping scheduling service...');

    // Clear background interval
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = null;
    }

    // Clear all scheduled tasks
    this.scheduledTasks.forEach((timeout, taskId) => {
      clearTimeout(timeout);
      console.log(`Cleared scheduled task: ${taskId}`);
    });
    this.scheduledTasks.clear();

    console.log('Scheduling service stopped successfully');
  }

  /**
   * Schedule experience delivery
   */
  async scheduleExperienceDelivery(experience: Experience): Promise<void> {
    try {
      const now = new Date();
      const deliveryTime = new Date(experience.scheduledTime);

      if (deliveryTime <= now) {
        // Deliver immediately if scheduled time has passed
        await this.deliverExperience(experience);
        return;
      }

      const delay = deliveryTime.getTime() - now.getTime();
      const taskId = `delivery_${experience.id}`;

      // Clear existing task if it exists
      if (this.scheduledTasks.has(taskId)) {
        clearTimeout(this.scheduledTasks.get(taskId)!);
      }

      // Schedule new task
      const timeout = setTimeout(async () => {
        try {
          await this.deliverExperience(experience);
          this.scheduledTasks.delete(taskId);
        } catch (error) {
          console.error(`Failed to deliver experience ${experience.id}:`, error);
        }
      }, delay);

      this.scheduledTasks.set(taskId, timeout);
      console.log(`Scheduled experience delivery for ${experience.id} at ${deliveryTime.toISOString()}`);
    } catch (error) {
      console.error('Error scheduling experience delivery:', error);
      throw new Error('Failed to schedule experience delivery');
    }
  }

  /**
   * Deliver experience
   */
  private async deliverExperience(experience: Experience): Promise<void> {
    try {
      console.log(`Delivering experience: ${experience.id}`);

      // Update experience status to delivered
      await this.experienceModel.updateStatus(experience.id, 'delivered');

      // Here you would typically:
      // 1. Send push notification
      // 2. Send email notification
      // 3. Update real-time systems
      // 4. Log delivery metrics

      console.log(`Experience ${experience.id} delivered successfully`);
    } catch (error) {
      console.error(`Error delivering experience ${experience.id}:`, error);
      throw error;
    }
  }

  /**
   * Run background tasks (every 30 minutes)
   */
  private async runBackgroundTasks(): Promise<void> {
    try {
      console.log('Running background tasks...');

      // 1. Process scheduled experiences
      await this.safeExecute('processScheduledExperiences', () => this.processScheduledExperiences());

      // 2. Check journey statuses
      await this.safeExecute('checkJourneyStatuses', () => this.checkJourneyStatuses());

      // 3. Analyze adaptation data
      await this.safeExecute('analyzeAdaptationData', () => this.analyzeAdaptationData());

      // 4. Clean up expired experiences
      await this.safeExecute('cleanupExpiredExperiences', () => this.cleanupExpiredExperiences());

      console.log('Background tasks completed successfully');
    } catch (error) {
      console.error('Error running background tasks:', error);
    }
  }

  /**
   * Safely execute a background task with error handling
   */
  private async safeExecute(taskName: string, task: () => Promise<void>): Promise<void> {
    try {
      await task();
    } catch (error: any) {
      // Handle Firestore NOT_FOUND errors gracefully during development
      if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
        console.log(`${taskName}: No data found (collections may be empty) - this is normal during initial setup`);
      } else {
        console.error(`Error ${taskName}:`, error);
      }
    }
  }

  /**
   * Process scheduled experiences that are due for delivery
   */
  private async processScheduledExperiences(): Promise<void> {
    try {
      const now = new Date();
      let scheduledExperiences: Experience[];

      try {
        scheduledExperiences = await this.experienceModel.getScheduledExperiences(now);
      } catch (error: any) {
        // Fallback to mock data
        if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
          console.log('📊 Using mock data for scheduled experiences');
          scheduledExperiences = MockDataService.getScheduledExperiences();
        } else {
          throw error;
        }
      }

      console.log(`Found ${scheduledExperiences.length} experiences ready for delivery`);

      for (const experience of scheduledExperiences) {
        try {
          await this.deliverExperience(experience);
        } catch (error) {
          console.error(`Failed to deliver experience ${experience.id}:`, error);
        }
      }
    } catch (error: any) {
      // Handle collection not found gracefully
      if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
        console.log('No scheduled experiences found - collections may be empty');
        return;
      }
      throw error;
    }
  }

  /**
   * Check and update journey statuses
   */
  private async checkJourneyStatuses(): Promise<void> {
    try {
      let activeJourneys: Journey[];

      try {
        activeJourneys = await this.journeyModel.getActiveJourneys();
      } catch (error: any) {
        // Fallback to mock data
        if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
          console.log('📊 Using mock data for active journeys');
          activeJourneys = MockDataService.getActiveJourneys();
        } else {
          throw error;
        }
      }

      console.log(`Checking ${activeJourneys.length} active journeys`);

      for (const journey of activeJourneys) {
        try {
          // Get journey experiences
          let experiences: Experience[];
          try {
            experiences = await this.experienceModel.getByJourneyId(journey.id);
          } catch (error: any) {
            // Fallback to mock data
            if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
              experiences = MockDataService.getExperiencesByRecipientId(journey.recipient.id);
            } else {
              throw error;
            }
          }
          
          // Calculate progress
          const totalExperiences = experiences.length;
          const completedExperiences = experiences.filter(exp => 
            ['viewed', 'reacted', 'shared'].includes(exp.status)
          ).length;

          // Update journey progress (only if using real database)
          if (!this.useMockData) {
            try {
              await this.journeyModel.updateProgress(journey.id, {
                totalExperiences,
                completedExperiences,
                currentStep: completedExperiences + 1,
              });

              // Check if journey is complete
              if (completedExperiences === totalExperiences && totalExperiences > 0) {
                await this.journeyModel.updateStatus(journey.id, 'completed');
                console.log(`Journey ${journey.id} marked as completed`);
              }
            } catch (error) {
              console.log('📊 Mock mode: Journey progress tracking simulated');
            }
          }
        } catch (error) {
          console.error(`Error checking journey ${journey.id}:`, error);
        }
      }
    } catch (error: any) {
      // Handle collection not found gracefully
      if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
        console.log('No active journeys found - collections may be empty');
        return;
      }
      throw error;
    }
  }

  /**
   * Analyze adaptation data and trigger adjustments
   */
  private async analyzeAdaptationData(): Promise<void> {
    try {
      // Get recent experiences with adaptation data
      let recentExperiences: Experience[];

      try {
        recentExperiences = await this.experienceModel.getByStatus('reacted', 50);
      } catch (error: any) {
        // Fallback to mock data
        if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
          console.log('📊 Using mock data for adaptation analysis');
          recentExperiences = MockDataService.getExperiencesByStatus('reacted');
        } else {
          throw error;
        }
      }

      console.log(`Analyzing adaptation data for ${recentExperiences.length} experiences`);

      // Group by recipient for analysis
      const recipientData = new Map<string, Experience[]>();
      
      recentExperiences.forEach(exp => {
        if (!recipientData.has(exp.recipientId)) {
          recipientData.set(exp.recipientId, []);
        }
        recipientData.get(exp.recipientId)!.push(exp);
      });

      // Analyze each recipient's engagement patterns
      for (const [recipientId, experiences] of recipientData) {
        try {
          await this.analyzeRecipientEngagement(recipientId, experiences);
        } catch (error) {
          console.error(`Error analyzing recipient ${recipientId}:`, error);
        }
      }
    } catch (error: any) {
      // Handle collection not found gracefully
      if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
        console.log('No adaptation data found - collections may be empty');
        return;
      }
      throw error;
    }
  }

  /**
   * Analyze individual recipient engagement
   */
  private async analyzeRecipientEngagement(recipientId: string, experiences: Experience[]): Promise<void> {
    try {
      // Calculate average engagement score
      const totalEngagement = experiences.reduce((sum, exp) => 
        sum + (exp.adaptationData?.engagementScore || 0), 0
      );
      const avgEngagement = totalEngagement / experiences.length;

      // Analyze content type preferences
      const contentTypeScores = new Map<string, number[]>();
      experiences.forEach(exp => {
        if (!contentTypeScores.has(exp.type)) {
          contentTypeScores.set(exp.type, []);
        }
        contentTypeScores.get(exp.type)!.push(exp.adaptationData?.engagementScore || 0);
      });

      // Find best performing content types
      const contentPreferences: { type: string; avgScore: number }[] = [];
      contentTypeScores.forEach((scores, type) => {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        contentPreferences.push({ type, avgScore });
      });

      contentPreferences.sort((a, b) => b.avgScore - a.avgScore);

      console.log(`Recipient ${recipientId} engagement analysis:`, {
        avgEngagement,
        preferredContentTypes: contentPreferences.slice(0, 3),
      });

      // Here you would typically:
      // 1. Update recipient preferences
      // 2. Adjust future content generation
      // 3. Modify delivery timing
      // 4. Store insights for future use
    } catch (error) {
      console.error(`Error analyzing recipient engagement for ${recipientId}:`, error);
    }
  }

  /**
   * Clean up expired experiences
   */
  private async cleanupExpiredExperiences(): Promise<void> {
    try {
      const now = new Date();
      const expiredCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

      // Find experiences that should be marked as expired
      let scheduledExperiences: Experience[];
      
      try {
        scheduledExperiences = await this.experienceModel.getByStatus('scheduled');
      } catch (error: any) {
        // Fallback to mock data
        if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
          console.log('📊 Using mock data for experience cleanup');
          scheduledExperiences = MockDataService.getExperiencesByStatus('scheduled');
        } else {
          throw error;
        }
      }
      
      let expiredCount = 0;
      for (const experience of scheduledExperiences) {
        if (new Date(experience.scheduledTime) < expiredCutoff) {
          // Only update if using real database
          if (!this.useMockData) {
            try {
              await this.experienceModel.updateStatus(experience.id, 'expired');
              expiredCount++;
            } catch (error) {
              console.log('📊 Mock mode: Experience cleanup simulated');
            }
          } else {
            // For mock data, just simulate the action
            MockDataService.updateExperienceStatus(experience.id, 'expired');
            expiredCount++;
          }
        }
      }

      if (expiredCount > 0) {
        console.log(`Marked ${expiredCount} experiences as expired`);
      }
    } catch (error: any) {
      // Handle collection not found gracefully
      if (error?.code === 5 || error?.message?.includes('NOT_FOUND')) {
        console.log('No scheduled experiences found for cleanup - collections may be empty');
        return;
      }
      throw error;
    }
  }

  /**
   * Get scheduling service status
   */
  getStatus(): {
    isRunning: boolean;
    scheduledTasksCount: number;
    uptime: number;
    mockDataStats?: any;
  } {
    const status = {
      isRunning: this.isRunning,
      scheduledTasksCount: this.scheduledTasks.size,
      uptime: this.isRunning ? Date.now() : 0,
    };

    // Add mock data statistics for development
    try {
      return {
        ...status,
        mockDataStats: MockDataService.getStats(),
      };
    } catch (error) {
      return status;
    }
  }

  /**
   * Schedule a custom task
   */
  scheduleTask(
    taskId: string,
    callback: () => Promise<void>,
    delay: number
  ): void {
    // Clear existing task if it exists
    if (this.scheduledTasks.has(taskId)) {
      clearTimeout(this.scheduledTasks.get(taskId)!);
    }

    // Schedule new task
    const timeout = setTimeout(async () => {
      try {
        await callback();
        this.scheduledTasks.delete(taskId);
      } catch (error) {
        console.error(`Scheduled task ${taskId} failed:`, error);
      }
    }, delay);

    this.scheduledTasks.set(taskId, timeout);
  }

  /**
   * Cancel a scheduled task
   */
  cancelTask(taskId: string): boolean {
    if (this.scheduledTasks.has(taskId)) {
      clearTimeout(this.scheduledTasks.get(taskId)!);
      this.scheduledTasks.delete(taskId);
      return true;
    }
    return false;
  }
}