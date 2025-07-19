import { firestore } from '../config/firebase';

export interface ContactInfo {
  email?: string;
  phone?: string;
  preferredChannel: 'email' | 'phone' | 'app';
}

export interface RoutineInfo {
  wakeUpTime?: string;
  workSchedule?: {
    start: string;
    end: string;
    days: string[];
  };
  freeTime?: string[];
  bedTime?: string;
  timezone?: string;
}

export interface SpecialDate {
  date: string;
  description: string;
  importance: 'low' | 'medium' | 'high';
}

export interface ContentPreferences {
  preferredTypes: string[];
  avoidTypes?: string[];
  maxLength?: number;
  preferredTone?: string;
}

export interface SocialPlatform {
  platform: string;
  username?: string;
  active: boolean;
}

export interface RecipientPersona {
  interests: string[];
  personality: string[];
  dailyRoutine: RoutineInfo;
  specialDates: SpecialDate[];
  preferences: ContentPreferences;
  communicationStyle: string;
  socialMediaPlatforms: SocialPlatform[];
}

export interface Recipient {
  id: string;
  name: string;
  relationship: string;
  createdById: string;
  persona: RecipientPersona;
  contactInfo: ContactInfo;
  preferences: {
    notificationPreferences?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
    privacyPreferences?: {
      shareData?: boolean;
      allowLocationTracking?: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperienceStrategy {
  id: string;
  recipientId: string;
  createdById: string;
  duration: number; // days
  theme: string[];
  intensity: 'subtle' | 'moderate' | 'immersive';
  contentTypes: string[];
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Journey {
  id: string;
  title: string;
  description?: string;
  createdById: string;
  recipient: Recipient;
  strategy: ExperienceStrategy;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  progress: {
    totalExperiences: number;
    completedExperiences: number;
    currentStep: number;
  };
  metadata: {
    totalCost: number;
    creditsUsed: number;
    estimatedDuration: number; // days
  };
  createdAt: Date;
  updatedAt: Date;
  launchedAt?: Date;
  completedAt?: Date;
}

export class JourneyModel {
  private collection = firestore.collection('journeys');

  /**
   * Create a new journey
   */
  async create(journeyData: Omit<Journey, 'id' | 'createdAt' | 'updatedAt'>): Promise<Journey> {
    try {
      const now = new Date();
      const journey: Journey = {
        ...journeyData,
        id: '', // Will be set by Firestore
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await this.collection.add(journey);
      const createdJourney = {
        ...journey,
        id: docRef.id,
      };

      // Update the document with the ID
      await docRef.update({ id: docRef.id });

      return createdJourney;
    } catch (error) {
      console.error('Error creating journey:', error);
      throw new Error('Failed to create journey');
    }
  }

  /**
   * Get journey by ID
   */
  async getById(journeyId: string): Promise<Journey | null> {
    try {
      const doc = await this.collection.doc(journeyId).get();
      
      if (!doc.exists) {
        return null;
      }

      return doc.data() as Journey;
    } catch (error) {
      console.error('Error getting journey:', error);
      throw new Error('Failed to get journey');
    }
  }

  /**
   * Get all journeys for a user
   */
  async getByUserId(userId: string, status?: string): Promise<Journey[]> {
    try {
      let query = this.collection.where('createdById', '==', userId);
      
      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.orderBy('createdAt', 'desc').get();
      
      return snapshot.docs.map(doc => doc.data() as Journey);
    } catch (error) {
      console.error('Error getting user journeys:', error);
      throw new Error('Failed to get user journeys');
    }
  }

  /**
   * Update journey
   */
  async update(journeyId: string, updates: Partial<Journey>): Promise<Journey | null> {
    try {
      const docRef = this.collection.doc(journeyId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date(),
      };

      await docRef.update(updatedData);

      const updatedDoc = await docRef.get();
      return updatedDoc.data() as Journey;
    } catch (error) {
      console.error('Error updating journey:', error);
      throw new Error('Failed to update journey');
    }
  }

  /**
   * Delete journey
   */
  async delete(journeyId: string): Promise<boolean> {
    try {
      const docRef = this.collection.doc(journeyId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return false;
      }

      await docRef.delete();
      return true;
    } catch (error) {
      console.error('Error deleting journey:', error);
      throw new Error('Failed to delete journey');
    }
  }

  /**
   * Update journey status
   */
  async updateStatus(journeyId: string, status: Journey['status']): Promise<Journey | null> {
    try {
      const updates: Partial<Journey> = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'active') {
        updates.launchedAt = new Date();
      } else if (status === 'completed') {
        updates.completedAt = new Date();
      }

      return await this.update(journeyId, updates);
    } catch (error) {
      console.error('Error updating journey status:', error);
      throw new Error('Failed to update journey status');
    }
  }

  /**
   * Update journey progress
   */
  async updateProgress(
    journeyId: string, 
    progress: Partial<Journey['progress']>
  ): Promise<Journey | null> {
    try {
      const journey = await this.getById(journeyId);
      
      if (!journey) {
        return null;
      }

      const updatedProgress = {
        ...journey.progress,
        ...progress,
      };

      return await this.update(journeyId, { progress: updatedProgress });
    } catch (error) {
      console.error('Error updating journey progress:', error);
      throw new Error('Failed to update journey progress');
    }
  }

  /**
   * Get active journeys (for background processing)
   */
  async getActiveJourneys(): Promise<Journey[]> {
    try {
      const snapshot = await this.collection
        .where('status', '==', 'active')
        .get();
      
      return snapshot.docs.map(doc => doc.data() as Journey);
    } catch (error) {
      console.error('Error getting active journeys:', error);
      throw new Error('Failed to get active journeys');
    }
  }

  /**
   * Check if user owns journey
   */
  async isOwner(journeyId: string, userId: string): Promise<boolean> {
    try {
      const journey = await this.getById(journeyId);
      return journey?.createdById === userId;
    } catch (error) {
      console.error('Error checking journey ownership:', error);
      return false;
    }
  }

  /**
   * Get journey statistics for a user
   */
  async getUserStats(userId: string): Promise<{
    total: number;
    active: number;
    completed: number;
    draft: number;
  }> {
    try {
      const journeys = await this.getByUserId(userId);
      
      return {
        total: journeys.length,
        active: journeys.filter(j => j.status === 'active').length,
        completed: journeys.filter(j => j.status === 'completed').length,
        draft: journeys.filter(j => j.status === 'draft').length,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user stats');
    }
  }
}