import { firestore } from '../config/firebase';

export interface SubscriptionDetails {
  type: 'free' | 'monthly' | 'yearly';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: Date;
}

export interface ExperiencePreferences {
  preferredContentTypes?: string[];
  preferredDeliveryTimes?: {
    morning?: boolean;
    afternoon?: boolean;
    evening?: boolean;
  };
  maxExperiencesPerDay?: number;
  allowLocationBasedExperiences?: boolean;
  shareDataForPersonalization?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  experienceCredits: number;
  subscription: SubscriptionDetails;
  preferences?: {
    notificationPreferences?: {
      email?: boolean;
      push?: boolean;
      experienceReminders?: boolean;
      adaptationNotifications?: boolean;
    };
    uiPreferences?: {
      theme?: string;
      language?: string;
      reducedMotion?: boolean;
    };
    experiencePreferences?: ExperiencePreferences;
    privacyPreferences?: {
      shareUsageData?: boolean;
      allowPersonalization?: boolean;
      dataRetentionPeriod?: number; // days
    };
  };
}

export class User {
  private collection = firestore.collection('users');

  /**
   * Create or update a user profile
   * @param userId Firebase Auth user ID
   * @param userData User profile data
   */
  async createOrUpdateProfile(userId: string, userData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const userRef = this.collection.doc(userId);
      let userDoc;
      
      try {
        userDoc = await userRef.get();
      } catch (error) {
        console.log('Error getting user document, might be first access:', error);
        // Continue with creation as if document doesn't exist
        userDoc = { exists: false };
      }
      
      const now = new Date();
      let userProfile: UserProfile;
      
      if (!userDoc.exists) {
        // Create new user profile with defaults
        userProfile = {
          id: userId,
          email: userData.email || '',
          displayName: userData.displayName || '',
          photoURL: userData.photoURL || '',
          createdAt: now,
          lastLoginAt: now,
          experienceCredits: userData.experienceCredits ?? 5, // 5 free experiences for new users
          subscription: userData.subscription || {
            type: 'free',
            status: 'active',
          },
          preferences: {
            notificationPreferences: {
              email: true,
              push: true,
              experienceReminders: true,
              adaptationNotifications: true,
              ...userData.preferences?.notificationPreferences,
            },
            uiPreferences: {
              theme: 'dark',
              language: 'en',
              reducedMotion: false,
              ...userData.preferences?.uiPreferences,
            },
            experiencePreferences: {
              preferredContentTypes: ['text', 'images', 'videos'],
              preferredDeliveryTimes: {
                morning: true,
                afternoon: true,
                evening: true,
              },
              maxExperiencesPerDay: 3,
              allowLocationBasedExperiences: false,
              shareDataForPersonalization: true,
              ...userData.preferences?.experiencePreferences,
            },
            privacyPreferences: {
              shareUsageData: false,
              allowPersonalization: true,
              dataRetentionPeriod: 365,
              ...userData.preferences?.privacyPreferences,
            },
            ...userData.preferences,
          },
        };
        
        try {
          await userRef.set(userProfile);
          console.log('Created new user profile for:', userId);
        } catch (error) {
          console.error('Error creating user profile, continuing with in-memory profile:', error);
          // Continue with the in-memory profile even if saving fails
        }
      } else {
        // Update existing user profile
        userProfile = (userDoc as any).data() as UserProfile;
        
        const updatedProfile = {
          ...userProfile,
          ...userData,
          lastLoginAt: now,
        };
        
        try {
          await userRef.update(updatedProfile);
          console.log('Updated user profile for:', userId);
        } catch (error) {
          console.error('Error updating user profile, continuing with in-memory profile:', error);
          // Continue with the in-memory profile even if saving fails
        }
        
        userProfile = updatedProfile;
      }
      
      return userProfile;
    } catch (error) {
      console.error('Error in createOrUpdateProfile:', error);
      
      // Return a basic profile even if Firestore operations fail
      return {
        id: userId,
        email: userData.email || '',
        displayName: userData.displayName || '',
        photoURL: userData.photoURL || '',
        createdAt: new Date(),
        lastLoginAt: new Date(),
        experienceCredits: 5,
        subscription: {
          type: 'free',
          status: 'active',
        },
        preferences: userData.preferences || {},
      };
    }
  }

  /**
   * Get a user profile by ID
   * @param userId Firebase Auth user ID
   */
  async getProfileById(userId: string): Promise<UserProfile | null> {
    const userRef = this.collection.doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    return userDoc.data() as UserProfile;
  }

  /**
   * Update user preferences
   * @param userId Firebase Auth user ID
   * @param preferences User preferences
   */
  async updatePreferences(
    userId: string,
    preferences: UserProfile['preferences']
  ): Promise<UserProfile | null> {
    const userRef = this.collection.doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userProfile = userDoc.data() as UserProfile;
    
    const updatedProfile = {
      ...userProfile,
      preferences: {
        ...userProfile.preferences,
        ...preferences,
      },
    };
    
    await userRef.update({
      preferences: updatedProfile.preferences,
    });
    
    return updatedProfile;
  }

  /**
   * Update user experience credits
   * @param userId Firebase Auth user ID
   * @param credits Number of credits to set (positive) or adjust (negative for deduction)
   * @param operation 'set' to set absolute value, 'add' to add credits, 'deduct' to subtract credits
   */
  async updateExperienceCredits(
    userId: string,
    credits: number,
    operation: 'set' | 'add' | 'deduct' = 'set'
  ): Promise<UserProfile | null> {
    const userRef = this.collection.doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userProfile = userDoc.data() as UserProfile;
    let newCredits: number;
    
    switch (operation) {
      case 'add':
        newCredits = (userProfile.experienceCredits || 0) + credits;
        break;
      case 'deduct':
        newCredits = Math.max(0, (userProfile.experienceCredits || 0) - credits);
        break;
      case 'set':
      default:
        newCredits = Math.max(0, credits);
        break;
    }
    
    const updatedProfile = {
      ...userProfile,
      experienceCredits: newCredits,
    };
    
    await userRef.update({
      experienceCredits: newCredits,
    });
    
    return updatedProfile;
  }

  /**
   * Update user subscription details
   * @param userId Firebase Auth user ID
   * @param subscriptionData Subscription details to update
   */
  async updateSubscription(
    userId: string,
    subscriptionData: Partial<SubscriptionDetails>
  ): Promise<UserProfile | null> {
    const userRef = this.collection.doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userProfile = userDoc.data() as UserProfile;
    
    const updatedSubscription = {
      ...userProfile.subscription,
      ...subscriptionData,
    };
    
    const updatedProfile = {
      ...userProfile,
      subscription: updatedSubscription,
    };
    
    await userRef.update({
      subscription: updatedSubscription,
    });
    
    return updatedProfile;
  }

  /**
   * Check if user has sufficient credits for an experience
   * @param userId Firebase Auth user ID
   * @param requiredCredits Number of credits required (default: 1)
   */
  async hasCredits(userId: string, requiredCredits: number = 1): Promise<boolean> {
    const userProfile = await this.getProfileById(userId);
    
    if (!userProfile) {
      return false;
    }
    
    return (userProfile.experienceCredits || 0) >= requiredCredits;
  }

  /**
   * Get user's current subscription status
   * @param userId Firebase Auth user ID
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionDetails | null> {
    const userProfile = await this.getProfileById(userId);
    
    if (!userProfile) {
      return null;
    }
    
    return userProfile.subscription;
  }

  /**
   * Update specific preference categories
   * @param userId Firebase Auth user ID
   * @param preferenceType Type of preferences to update
   * @param preferences Preference data to update
   */
  async updateSpecificPreferences(
    userId: string,
    preferenceType: 'notification' | 'ui' | 'experience' | 'privacy',
    preferences: any
  ): Promise<UserProfile | null> {
    const userRef = this.collection.doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userProfile = userDoc.data() as UserProfile;
    const currentPreferences = userProfile.preferences || {};
    
    let updatedPreferences;
    
    switch (preferenceType) {
      case 'notification':
        updatedPreferences = {
          ...currentPreferences,
          notificationPreferences: {
            ...currentPreferences.notificationPreferences,
            ...preferences,
          },
        };
        break;
      case 'ui':
        updatedPreferences = {
          ...currentPreferences,
          uiPreferences: {
            ...currentPreferences.uiPreferences,
            ...preferences,
          },
        };
        break;
      case 'experience':
        updatedPreferences = {
          ...currentPreferences,
          experiencePreferences: {
            ...currentPreferences.experiencePreferences,
            ...preferences,
          },
        };
        break;
      case 'privacy':
        updatedPreferences = {
          ...currentPreferences,
          privacyPreferences: {
            ...currentPreferences.privacyPreferences,
            ...preferences,
          },
        };
        break;
      default:
        return null;
    }
    
    const updatedProfile = {
      ...userProfile,
      preferences: updatedPreferences,
    };
    
    await userRef.update({
      preferences: updatedPreferences,
    });
    
    return updatedProfile;
  }

  /**
   * Find user by Stripe customer ID
   * @param stripeCustomerId Stripe customer ID
   */
  async findByStripeCustomerId(stripeCustomerId: string): Promise<string | null> {
    try {
      const querySnapshot = await this.collection
        .where('subscription.stripeCustomerId', '==', stripeCustomerId)
        .limit(1)
        .get();
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const userDoc = querySnapshot.docs[0];
      return userDoc.id;
    } catch (error) {
      console.error('Error finding user by Stripe customer ID:', error);
      return null;
    }
  }

  /**
   * Delete a user profile
   * @param userId Firebase Auth user ID
   */
  async deleteProfile(userId: string): Promise<boolean> {
    const userRef = this.collection.doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    await userRef.delete();
    return true;
  }
}