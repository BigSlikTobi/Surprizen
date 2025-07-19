import { firestore } from './firebase';

/**
 * Initialize Firestore collections with sample data for development
 */
export const initFirestore = async (): Promise<void> => {
  try {
    console.log('Initializing Firestore collections...');
    
    // Initialize collections with minimal data to ensure they exist
    await Promise.all([
      initUsersCollection(),
      initJourneysCollection(),
      initExperiencesCollection(),
      initRecipientsCollection(),
    ]);
    
    console.log('Firestore collections initialized successfully');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    console.log('Continuing without Firestore initialization');
  }
};

/**
 * Initialize users collection
 */
const initUsersCollection = async (): Promise<void> => {
  try {
    const usersCollection = firestore.collection('users');
    
    // Check if collection has any documents
    const snapshot = await usersCollection.limit(1).get();
    
    if (snapshot.empty) {
      // Create a sample user for development
      await usersCollection.doc('sample-user').set({
        id: 'sample-user',
        email: 'developer@surprizen.com',
        displayName: 'Development User',
        photoURL: null,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          notifications: true,
          theme: 'auto',
        },
        subscription: {
          type: 'free',
          creditsRemaining: 5,
        },
        experienceCredits: 5,
      });
      console.log('✓ Users collection initialized with sample data');
    } else {
      console.log('✓ Users collection already exists');
    }
  } catch (error) {
    console.error('Error initializing users collection:', error);
  }
};

/**
 * Initialize journeys collection
 */
const initJourneysCollection = async (): Promise<void> => {
  try {
    const journeysCollection = firestore.collection('journeys');
    
    // Check if collection has any documents
    const snapshot = await journeysCollection.limit(1).get();
    
    if (snapshot.empty) {
      // Create a sample journey for development
      await journeysCollection.doc('sample-journey').set({
        id: 'sample-journey',
        title: 'Sample Birthday Journey',
        description: 'A sample journey for testing purposes',
        createdById: 'sample-user',
        recipient: {
          id: 'sample-recipient',
          name: 'Sample Recipient',
          relationship: 'friend',
          createdById: 'sample-user',
          persona: {
            interests: ['technology', 'gaming', 'music'],
            personality: ['creative', 'outgoing', 'tech-savvy'],
            dailyRoutine: {
              wakeTime: '8:00',
              workHours: '9:00-17:00',
              freeTime: 'evenings',
            },
            specialDates: [],
            preferences: {
              contentTypes: ['text', 'image'],
              themes: ['fun', 'nostalgic'],
            },
            communicationStyle: 'casual',
            socialMediaPlatforms: ['instagram', 'tiktok'],
          },
          contactInfo: {
            email: 'recipient@example.com',
            phone: null,
            preferredContact: 'email',
          },
          preferences: {
            notificationPreferences: {
              email: true,
              push: true,
              sms: false,
            },
            privacyPreferences: {
              shareData: false,
              allowLocationTracking: false,
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        strategy: {
          id: 'sample-strategy',
          recipientId: 'sample-recipient',
          createdById: 'sample-user',
          duration: 3,
          theme: ['fun', 'nostalgic'],
          intensity: 'moderate',
          contentTypes: ['text', 'image'],
          startDate: new Date(),
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        status: 'draft',
        progress: {
          totalExperiences: 0,
          completedExperiences: 0,
          currentStep: 0,
        },
        metadata: {
          totalCost: 3,
          creditsUsed: 0,
          estimatedDuration: 3,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✓ Journeys collection initialized with sample data');
    } else {
      console.log('✓ Journeys collection already exists');
    }
  } catch (error) {
    console.error('Error initializing journeys collection:', error);
  }
};

/**
 * Initialize experiences collection
 */
const initExperiencesCollection = async (): Promise<void> => {
  try {
    const experiencesCollection = firestore.collection('experiences');
    
    // Check if collection has any documents
    const snapshot = await experiencesCollection.limit(1).get();
    
    if (snapshot.empty) {
      // Create a sample experience for development
      await experiencesCollection.doc('sample-experience').set({
        id: 'sample-experience',
        journeyId: 'sample-journey',
        strategyId: 'sample-strategy',
        recipientId: 'sample-recipient',
        createdById: 'sample-user',
        type: 'text',
        content: {
          title: 'Welcome to your journey!',
          description: 'This is the beginning of something special.',
          text: 'Hey there! Get ready for an amazing few days ahead. I have some fun surprises planned for you! 🎉',
          mediaUrl: null,
          mediaType: null,
          metadata: {},
        },
        scheduledTime: new Date(Date.now() + 60 * 1000), // 1 minute from now
        status: 'scheduled',
        reactions: [],
        adaptationData: {
          engagementScore: 0,
          sentimentScore: 0,
          responseTime: 0,
          contextualRelevance: 0,
          personalizedElements: [],
          adaptationTriggers: [],
        },
        sequenceNumber: 1,
        isCurrentStep: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✓ Experiences collection initialized with sample data');
    } else {
      console.log('✓ Experiences collection already exists');
    }
  } catch (error) {
    console.error('Error initializing experiences collection:', error);
  }
};

/**
 * Initialize recipients collection
 */
const initRecipientsCollection = async (): Promise<void> => {
  try {
    const recipientsCollection = firestore.collection('recipients');
    
    // Check if collection has any documents
    const snapshot = await recipientsCollection.limit(1).get();
    
    if (snapshot.empty) {
      // Create a sample recipient for development
      await recipientsCollection.doc('sample-recipient').set({
        id: 'sample-recipient',
        name: 'Sample Recipient',
        relationship: 'friend',
        createdById: 'sample-user',
        persona: {
          interests: ['technology', 'gaming', 'music'],
          personality: ['creative', 'outgoing', 'tech-savvy'],
          dailyRoutine: {
            wakeTime: '8:00',
            workHours: '9:00-17:00',
            freeTime: 'evenings',
          },
          specialDates: [],
          preferences: {
            contentTypes: ['text', 'image'],
            themes: ['fun', 'nostalgic'],
          },
          communicationStyle: 'casual',
          socialMediaPlatforms: ['instagram', 'tiktok'],
        },
        contactInfo: {
          email: 'recipient@example.com',
          phone: null,
          preferredContact: 'email',
        },
        preferences: {
          notificationPreferences: {
            email: true,
            push: true,
            sms: false,
          },
          privacyPreferences: {
            shareData: false,
            allowLocationTracking: false,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✓ Recipients collection initialized with sample data');
    } else {
      console.log('✓ Recipients collection already exists');
    }
  } catch (error) {
    console.error('Error initializing recipients collection:', error);
  }
};