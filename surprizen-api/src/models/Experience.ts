import { firestore } from '../config/firebase';

export interface LocationData {
  latitude?: number;
  longitude?: number;
  address?: string;
  relevantPlaces?: string[];
}

export interface TimeData {
  preferredTime?: string;
  timeZone?: string;
  dayOfWeek?: string;
  isSpecialDate?: boolean;
}

export interface VoucherDetails {
  type: 'discount' | 'freebie' | 'experience' | 'gift_card';
  title: string;
  description: string;
  value?: number;
  currency?: string;
  expiryDate?: Date;
  redemptionCode?: string;
  terms?: string[];
  merchantName?: string;
  merchantLogo?: string;
}

export interface ExperienceContent {
  title: string;
  description: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'gif';
  text?: string;
  voucherDetails?: VoucherDetails;
  locationRelevance?: LocationData;
  timeRelevance?: TimeData;
  personalizationTokens?: Record<string, any>;
  estimatedEngagementTime?: number; // seconds
}

export interface AdaptationData {
  engagementScore: number;
  timeSpentViewing: number;
  reactionType?: string;
  shared: boolean;
  sharingPlatforms: string[];
  feedbackProvided: boolean;
  adaptationTriggers: string[];
}

export interface Reaction {
  id: string;
  experienceId: string;
  recipientId: string;
  type: 'love' | 'like' | 'laugh' | 'wow' | 'sad' | 'angry' | 'heart' | 'fire' | 'clap';
  emoji: string;
  timestamp: Date;
  details?: string;
  shared: boolean;
  sharingPlatforms: string[];
}

export interface Experience {
  id: string;
  journeyId: string;
  strategyId: string;
  recipientId: string;
  createdById: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'voucher' | 'challenge' | 'memory';
  content: ExperienceContent;
  scheduledTime: Date;
  actualDeliveryTime?: Date;
  status: 'scheduled' | 'delivered' | 'viewed' | 'reacted' | 'shared' | 'expired';
  reactions: Reaction[];
  adaptationData: AdaptationData;
  sequenceNumber: number;
  isCurrentStep: boolean;
  createdAt: Date;
  updatedAt: Date;
  viewedAt?: Date;
  expiredAt?: Date;
}

export class ExperienceModel {
  private collection = firestore.collection('experiences');

  /**
   * Create a new experience
   */
  async create(experienceData: Omit<Experience, 'id' | 'createdAt' | 'updatedAt'>): Promise<Experience> {
    try {
      const now = new Date();
      const experience: Experience = {
        ...experienceData,
        id: '', // Will be set by Firestore
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await this.collection.add(experience);
      const createdExperience = {
        ...experience,
        id: docRef.id,
      };

      // Update the document with the ID
      await docRef.update({ id: docRef.id });

      return createdExperience;
    } catch (error) {
      console.error('Error creating experience:', error);
      throw new Error('Failed to create experience');
    }
  }

  /**
   * Get experience by ID
   */
  async getById(experienceId: string): Promise<Experience | null> {
    try {
      const doc = await this.collection.doc(experienceId).get();
      
      if (!doc.exists) {
        return null;
      }

      return doc.data() as Experience;
    } catch (error) {
      console.error('Error getting experience:', error);
      throw new Error('Failed to get experience');
    }
  }

  /**
   * Get experiences for a recipient
   */
  async getByRecipientId(recipientId: string, limit?: number): Promise<Experience[]> {
    try {
      let query = this.collection
        .where('recipientId', '==', recipientId)
        .orderBy('scheduledTime', 'desc');
      
      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => doc.data() as Experience);
    } catch (error) {
      console.error('Error getting recipient experiences:', error);
      throw new Error('Failed to get recipient experiences');
    }
  }

  /**
   * Get experiences for a journey
   */
  async getByJourneyId(journeyId: string): Promise<Experience[]> {
    try {
      const snapshot = await this.collection
        .where('journeyId', '==', journeyId)
        .orderBy('sequenceNumber', 'asc')
        .get();
      
      return snapshot.docs.map(doc => doc.data() as Experience);
    } catch (error) {
      console.error('Error getting journey experiences:', error);
      throw new Error('Failed to get journey experiences');
    }
  }

  /**
   * Get current experience for recipient
   */
  async getCurrentExperience(recipientId: string): Promise<Experience | null> {
    try {
      const snapshot = await this.collection
        .where('recipientId', '==', recipientId)
        .where('isCurrentStep', '==', true)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as Experience;
    } catch (error) {
      console.error('Error getting current experience:', error);
      throw new Error('Failed to get current experience');
    }
  }

  /**
   * Update experience status
   */
  async updateStatus(experienceId: string, status: Experience['status']): Promise<Experience | null> {
    try {
      const docRef = this.collection.doc(experienceId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const updates: Partial<Experience> = {
        status,
        updatedAt: new Date(),
      };

      if (status === 'viewed') {
        updates.viewedAt = new Date();
      } else if (status === 'expired') {
        updates.expiredAt = new Date();
      } else if (status === 'delivered') {
        updates.actualDeliveryTime = new Date();
      }

      await docRef.update(updates);

      const updatedDoc = await docRef.get();
      return updatedDoc.data() as Experience;
    } catch (error) {
      console.error('Error updating experience status:', error);
      throw new Error('Failed to update experience status');
    }
  }

  /**
   * Add reaction to experience
   */
  async addReaction(experienceId: string, reaction: Omit<Reaction, 'id'>): Promise<Experience | null> {
    try {
      const docRef = this.collection.doc(experienceId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const experience = doc.data() as Experience;
      const newReaction: Reaction = {
        ...reaction,
        id: `${experienceId}_${Date.now()}`,
      };

      const updatedReactions = [...experience.reactions, newReaction];
      
      await docRef.update({
        reactions: updatedReactions,
        status: 'reacted',
        updatedAt: new Date(),
      });

      const updatedDoc = await docRef.get();
      return updatedDoc.data() as Experience;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw new Error('Failed to add reaction');
    }
  }

  /**
   * Update adaptation data
   */
  async updateAdaptationData(
    experienceId: string, 
    adaptationData: Partial<AdaptationData>
  ): Promise<Experience | null> {
    try {
      const docRef = this.collection.doc(experienceId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return null;
      }

      const experience = doc.data() as Experience;
      const updatedAdaptationData = {
        ...experience.adaptationData,
        ...adaptationData,
      };

      await docRef.update({
        adaptationData: updatedAdaptationData,
        updatedAt: new Date(),
      });

      const updatedDoc = await docRef.get();
      return updatedDoc.data() as Experience;
    } catch (error) {
      console.error('Error updating adaptation data:', error);
      throw new Error('Failed to update adaptation data');
    }
  }

  /**
   * Get scheduled experiences (for delivery system)
   */
  async getScheduledExperiences(beforeTime?: Date): Promise<Experience[]> {
    try {
      const cutoffTime = beforeTime || new Date();
      
      const snapshot = await this.collection
        .where('status', '==', 'scheduled')
        .where('scheduledTime', '<=', cutoffTime)
        .orderBy('scheduledTime', 'asc')
        .get();
      
      return snapshot.docs.map(doc => doc.data() as Experience);
    } catch (error) {
      console.error('Error getting scheduled experiences:', error);
      throw new Error('Failed to get scheduled experiences');
    }
  }

  /**
   * Set current step for recipient
   */
  async setCurrentStep(recipientId: string, experienceId: string): Promise<boolean> {
    try {
      // First, unset all current steps for this recipient
      const currentSteps = await this.collection
        .where('recipientId', '==', recipientId)
        .where('isCurrentStep', '==', true)
        .get();

      const batch = firestore.batch();

      // Unset existing current steps
      currentSteps.docs.forEach(doc => {
        batch.update(doc.ref, { isCurrentStep: false, updatedAt: new Date() });
      });

      // Set new current step
      const newCurrentStepRef = this.collection.doc(experienceId);
      batch.update(newCurrentStepRef, { isCurrentStep: true, updatedAt: new Date() });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error setting current step:', error);
      throw new Error('Failed to set current step');
    }
  }

  /**
   * Get experiences by status
   */
  async getByStatus(status: Experience['status'], limit?: number): Promise<Experience[]> {
    try {
      let query = this.collection.where('status', '==', status);
      
      if (limit) {
        query = query.limit(limit);
      }

      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => doc.data() as Experience);
    } catch (error) {
      console.error('Error getting experiences by status:', error);
      throw new Error('Failed to get experiences by status');
    }
  }

  /**
   * Delete experience
   */
  async delete(experienceId: string): Promise<boolean> {
    try {
      const docRef = this.collection.doc(experienceId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return false;
      }

      await docRef.delete();
      return true;
    } catch (error) {
      console.error('Error deleting experience:', error);
      throw new Error('Failed to delete experience');
    }
  }
}