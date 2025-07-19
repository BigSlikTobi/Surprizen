import { Journey, Recipient, ExperienceStrategy } from '../models/Journey';
import { Experience, ExperienceContent, AdaptationData, Reaction } from '../models/Experience';

/**
 * Mock data service for development when Firestore is not available
 * This service provides sample data that matches the requirements and design specifications
 */
export class MockDataService {
  private static journeys: Journey[] = [];
  private static experiences: Experience[] = [];
  private static recipients: Recipient[] = [];
  private static initialized = false;

  /**
   * Initialize mock data collections
   */
  static initialize(): void {
    if (this.initialized) return;

    console.log('🔧 Initializing mock data service for development...');
    
    // Create sample recipients
    this.createSampleRecipients();
    
    // Create sample journeys
    this.createSampleJourneys();
    
    // Create sample experiences
    this.createSampleExperiences();
    
    this.initialized = true;
    console.log('✅ Mock data service initialized with sample data');
    console.log(`   📊 ${this.journeys.length} journeys, ${this.experiences.length} experiences, ${this.recipients.length} recipients`);
  }

  /**
   * Create sample recipients following the persona structure from requirements
   */
  private static createSampleRecipients(): void {
    const sampleRecipients: Recipient[] = [
      {
        id: 'sample-recipient-1',
        name: 'Alex Chen',
        relationship: 'best friend',
        createdById: 'sample-user',
        persona: {
          interests: ['gaming', 'anime', 'tech gadgets', 'bubble tea'],
          personality: ['creative', 'introverted', 'tech-savvy', 'loyal'],
          dailyRoutine: {
            wakeUpTime: '10:00',
            workSchedule: {
              start: '10:00',
              end: '18:00',
              days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            },
            freeTime: ['evenings', 'weekends'],
            bedTime: '1:00',
            timezone: 'America/New_York',
          },
          specialDates: [
            {
              date: '2025-08-15',
              description: 'Birthday - loves surprise parties',
              importance: 'high' as const,
            }
          ],
          preferences: {
            preferredTypes: ['text', 'image', 'voucher'],
            avoidTypes: ['video'],
            preferredTone: 'casual and playful',
          },
          communicationStyle: 'casual',
          socialMediaPlatforms: [
            {
              platform: 'instagram',
              username: 'alexgamer123',
              active: true,
            },
            {
              platform: 'tiktok',
              username: 'alex_chen_gaming',
              active: true,
            },
            {
              platform: 'discord',
              username: 'AlexChen#1234',
              active: true,
            }
          ],
        },
        contactInfo: {
          email: 'alex.chen@example.com',
          phone: '+1-555-0123',
          preferredChannel: 'app' as const,
        },
        preferences: {
          notificationPreferences: {
            email: false,
            push: true,
            sms: true,
          },
          privacyPreferences: {
            shareData: false,
            allowLocationTracking: true,
          },
        },
        createdAt: new Date('2025-07-01'),
        updatedAt: new Date(),
      },
      {
        id: 'sample-recipient-2',
        name: 'Jordan Smith',
        relationship: 'partner',
        createdById: 'sample-user',
        persona: {
          interests: ['fitness', 'cooking', 'travel', 'photography'],
          personality: ['outgoing', 'adventurous', 'health-conscious', 'creative'],
          dailyRoutine: {
            wakeUpTime: '6:30',
            workSchedule: {
              start: '8:00',
              end: '17:00',
              days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            },
            freeTime: ['early mornings', 'evenings'],
            bedTime: '22:30',
            timezone: 'America/New_York',
          },
          specialDates: [
            {
              date: '2025-09-20',
              description: 'Our 2-year anniversary - very romantic',
              importance: 'high' as const,
            }
          ],
          preferences: {
            preferredTypes: ['image', 'video', 'memory'],
            preferredTone: 'warm and encouraging',
          },
          communicationStyle: 'warm',
          socialMediaPlatforms: [
            {
              platform: 'instagram',
              username: 'jordan_adventures',
              active: true,
            },
            {
              platform: 'strava',
              username: 'jordan_fitness',
              active: true,
            },
            {
              platform: 'pinterest',
              username: 'jordan_cooking',
              active: true,
            }
          ],
        },
        contactInfo: {
          email: 'jordan.smith@example.com',
          phone: '+1-555-0456',
          preferredChannel: 'email' as const,
        },
        preferences: {
          notificationPreferences: {
            email: true,
            push: true,
            sms: false,
          },
          privacyPreferences: {
            shareData: true,
            allowLocationTracking: true,
          },
        },
        createdAt: new Date('2025-06-15'),
        updatedAt: new Date(),
      }
    ];

    this.recipients = sampleRecipients;
  }

  /**
   * Create sample journeys following the strategy structure from requirements
   */
  private static createSampleJourneys(): void {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const sampleJourneys: Journey[] = [
      {
        id: 'sample-journey-1',
        title: 'Birthday Countdown for Alex',
        description: 'A fun 3-day birthday surprise journey with gaming and tech themes',
        createdById: 'sample-user',
        recipient: this.recipients[0],
        strategy: {
          id: 'sample-strategy-1',
          recipientId: 'sample-recipient-1',
          createdById: 'sample-user',
          duration: 3,
          theme: ['fun', 'nostalgic', 'tech-related'],
          intensity: 'moderate' as const,
          contentTypes: ['text', 'image', 'voucher'],
          startDate: now,
          endDate: threeDaysFromNow,
          status: 'active' as const,
          createdAt: new Date('2025-07-15'),
          updatedAt: new Date(),
        },
        status: 'active' as const,
        progress: {
          totalExperiences: 6,
          completedExperiences: 2,
          currentStep: 3,
        },
        metadata: {
          totalCost: 6,
          creditsUsed: 6,
          estimatedDuration: 3,
        },
        createdAt: new Date('2025-07-15'),
        updatedAt: new Date(),
        launchedAt: new Date('2025-07-18'),
      },
      {
        id: 'sample-journey-2',
        title: 'Romantic Anniversary Week',
        description: 'A week-long romantic journey leading up to our anniversary',
        createdById: 'sample-user',
        recipient: this.recipients[1],
        strategy: {
          id: 'sample-strategy-2',
          recipientId: 'sample-recipient-2',
          createdById: 'sample-user',
          duration: 7,
          theme: ['romantic', 'adventure', 'wellness'],
          intensity: 'immersive' as const,
          contentTypes: ['image', 'video', 'memory', 'voucher'],
          startDate: now,
          endDate: weekFromNow,
          status: 'draft' as const,
          createdAt: new Date('2025-07-10'),
          updatedAt: new Date(),
        },
        status: 'draft' as const,
        progress: {
          totalExperiences: 0,
          completedExperiences: 0,
          currentStep: 0,
        },
        metadata: {
          totalCost: 14,
          creditsUsed: 0,
          estimatedDuration: 7,
        },
        createdAt: new Date('2025-07-10'),
        updatedAt: new Date(),
      }
    ];

    this.journeys = sampleJourneys;
  }

  /**
   * Create sample experiences following the content structure from requirements
   */
  private static createSampleExperiences(): void {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    const inOneHour = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const sampleExperiences: Experience[] = [
      {
        id: 'sample-experience-1',
        journeyId: 'sample-journey-1',
        strategyId: 'sample-strategy-1',
        recipientId: 'sample-recipient-1',
        createdById: 'sample-user',
        type: 'text',
        content: {
          title: 'Birthday Countdown Begins! 🎉',
          description: 'Your special 3-day birthday surprise has started!',
          text: 'Hey Alex! 🎮 Guess what? Your birthday countdown has officially begun! I\'ve planned some awesome surprises over the next 3 days. Get ready for some epic moments! Your first surprise is coming in a few hours... 👀',
          mediaUrl: undefined,
          mediaType: undefined,
          personalizationTokens: {
            personalizedElements: ['name', 'gaming_reference', 'birthday_theme'],
            tone: 'excited_friendly',
          },
        },
        scheduledTime: twoHoursAgo,
        actualDeliveryTime: twoHoursAgo,
        status: 'reacted',
        reactions: [
          {
            id: 'reaction-1',
            experienceId: 'sample-experience-1',
            recipientId: 'sample-recipient-1',
            type: 'love',
            emoji: '😍',
            timestamp: new Date(twoHoursAgo.getTime() + 10 * 60 * 1000),
            shared: true,
            sharingPlatforms: ['instagram'],
          }
        ],
        adaptationData: {
          engagementScore: 0.9,
          timeSpentViewing: 600, // 10 minutes in seconds
          reactionType: 'love',
          shared: true,
          sharingPlatforms: ['instagram'],
          feedbackProvided: true,
          adaptationTriggers: ['high_engagement', 'positive_sentiment'],
        },
        sequenceNumber: 1,
        isCurrentStep: false,
        createdAt: new Date('2025-07-18'),
        updatedAt: new Date(),
        viewedAt: new Date(twoHoursAgo.getTime() + 5 * 60 * 1000),
      },
      {
        id: 'sample-experience-2',
        journeyId: 'sample-journey-1',
        strategyId: 'sample-strategy-1',
        recipientId: 'sample-recipient-1',
        createdById: 'sample-user',
        type: 'voucher',
        content: {
          title: 'Bubble Tea Time! 🧋',
          description: 'A special treat for your favorite drink',
          text: 'Since you love bubble tea so much, here\'s a voucher for your favorite boba place! Enjoy a drink on me today 🧋✨',
          mediaUrl: 'https://example.com/voucher-bubble-tea.png',
          mediaType: 'image',
          voucherDetails: {
            type: 'gift_card',
            title: 'Bubble Tea Voucher',
            description: 'Enjoy your favorite bubble tea on me!',
            value: 15.00,
            currency: 'USD',
            expiryDate: new Date('2025-08-19'),
            redemptionCode: 'BIRTHDAY2025',
            terms: ['Valid at Boba Paradise locations', 'Cannot be combined with other offers'],
            merchantName: 'Boba Paradise',
          },
          personalizationTokens: {
            personalizedElements: ['favorite_drink', 'local_merchant'],
            contextualTriggers: ['afternoon_timing', 'favorite_treat'],
          },
        },
        scheduledTime: oneHourAgo,
        actualDeliveryTime: oneHourAgo,
        status: 'viewed',
        reactions: [
          {
            id: 'reaction-2',
            experienceId: 'sample-experience-2',
            recipientId: 'sample-recipient-1',
            type: 'heart',
            emoji: '❤️',
            timestamp: new Date(oneHourAgo.getTime() + 15 * 60 * 1000),
            shared: false,
            sharingPlatforms: [],
          }
        ],
        adaptationData: {
          engagementScore: 0.8,
          timeSpentViewing: 900, // 15 minutes in seconds
          reactionType: 'heart',
          shared: false,
          sharingPlatforms: [],
          feedbackProvided: true,
          adaptationTriggers: ['voucher_appreciation', 'quick_response'],
        },
        sequenceNumber: 2,
        isCurrentStep: false,
        createdAt: new Date('2025-07-18'),
        updatedAt: new Date(),
        viewedAt: new Date(oneHourAgo.getTime() + 2 * 60 * 1000),
      },
      {
        id: 'sample-experience-3',
        journeyId: 'sample-journey-1',
        strategyId: 'sample-strategy-1',
        recipientId: 'sample-recipient-1',
        createdById: 'sample-user',
        type: 'image',
        content: {
          title: 'Memory Lane 📸',
          description: 'A throwback to our gaming adventures',
          text: 'Remember when we stayed up all night trying to beat that boss? Those were epic times! 🎮 Here\'s to many more gaming adventures together!',
          mediaUrl: 'https://example.com/gaming-memory.jpg',
          mediaType: 'image',
          personalizationTokens: {
            personalizedElements: ['shared_memory', 'gaming_reference'],
            nostalgicValue: 'high',
          },
        },
        scheduledTime: inOneHour,
        status: 'scheduled',
        reactions: [],
        adaptationData: {
          engagementScore: 0,
          timeSpentViewing: 0,
          shared: false,
          sharingPlatforms: [],
          feedbackProvided: false,
          adaptationTriggers: [],
        },
        sequenceNumber: 3,
        isCurrentStep: true,
        createdAt: new Date('2025-07-18'),
        updatedAt: new Date(),
      },
      {
        id: 'sample-experience-4',
        journeyId: 'sample-journey-1',
        strategyId: 'sample-strategy-1',
        recipientId: 'sample-recipient-1',
        createdById: 'sample-user',
        type: 'challenge',
        content: {
          title: 'Gaming Challenge! 🏆',
          description: 'A fun mini-challenge for the gaming enthusiast',
          text: 'Challenge time! Can you beat your high score on your favorite mobile game today? Screenshot your score and I\'ll buy you dinner! 🍕 Game on!',
          mediaUrl: undefined,
          mediaType: undefined,
          personalizationTokens: {
            challengeType: 'gaming_highscore',
            reward: 'dinner_treat',
            personalizedElements: ['gaming_interest', 'competitive_spirit'],
          },
        },
        scheduledTime: inTwoHours,
        status: 'scheduled',
        reactions: [],
        adaptationData: {
          engagementScore: 0,
          timeSpentViewing: 0,
          shared: false,
          sharingPlatforms: [],
          feedbackProvided: false,
          adaptationTriggers: [],
        },
        sequenceNumber: 4,
        isCurrentStep: false,
        createdAt: new Date('2025-07-18'),
        updatedAt: new Date(),
      }
    ];

    this.experiences = sampleExperiences;
  }

  /**
   * Get all journeys for a user
   */
  static getJourneysByUserId(userId: string): Journey[] {
    return this.journeys.filter(journey => journey.createdById === userId);
  }

  /**
   * Get journey by ID
   */
  static getJourneyById(journeyId: string): Journey | null {
    return this.journeys.find(journey => journey.id === journeyId) || null;
  }

  /**
   * Get experiences for a recipient
   */
  static getExperiencesByRecipientId(recipientId: string): Experience[] {
    return this.experiences.filter(exp => exp.recipientId === recipientId);
  }

  /**
   * Get current experience for recipient
   */
  static getCurrentExperience(recipientId: string): Experience | null {
    return this.experiences.find(exp => 
      exp.recipientId === recipientId && exp.isCurrentStep
    ) || null;
  }

  /**
   * Get scheduled experiences
   */
  static getScheduledExperiences(): Experience[] {
    return this.experiences.filter(exp => exp.status === 'scheduled');
  }

  /**
   * Get active journeys
   */
  static getActiveJourneys(): Journey[] {
    return this.journeys.filter(journey => journey.status === 'active');
  }

  /**
   * Get experiences by status
   */
  static getExperiencesByStatus(status: Experience['status']): Experience[] {
    return this.experiences.filter(exp => exp.status === status);
  }

  /**
   * Add a new journey (for testing)
   */
  static addJourney(journey: Journey): void {
    this.journeys.push(journey);
  }

  /**
   * Add a new experience (for testing)
   */
  static addExperience(experience: Experience): void {
    this.experiences.push(experience);
  }

  /**
   * Update experience status
   */
  static updateExperienceStatus(experienceId: string, status: Experience['status']): Experience | null {
    const experience = this.experiences.find(exp => exp.id === experienceId);
    if (experience) {
      experience.status = status;
      experience.updatedAt = new Date();
      
      if (status === 'delivered') {
        experience.actualDeliveryTime = new Date();
      } else if (status === 'viewed') {
        experience.viewedAt = new Date();
      }
    }
    return experience || null;
  }

  /**
   * Add reaction to experience
   */
  static addReactionToExperience(experienceId: string, reaction: Omit<Reaction, 'id'>): Experience | null {
    const experience = this.experiences.find(exp => exp.id === experienceId);
    if (experience) {
      const newReaction: Reaction = {
        ...reaction,
        id: `reaction-${Date.now()}`,
      };
      experience.reactions.push(newReaction);
      experience.status = 'reacted';
      experience.updatedAt = new Date();
    }
    return experience || null;
  }

  /**
   * Get summary statistics
   */
  static getStats(): {
    totalJourneys: number;
    activeJourneys: number;
    totalExperiences: number;
    scheduledExperiences: number;
    completedExperiences: number;
  } {
    const activeJourneys = this.journeys.filter(j => j.status === 'active').length;
    const scheduledExperiences = this.experiences.filter(e => e.status === 'scheduled').length;
    const completedExperiences = this.experiences.filter(e => 
      ['viewed', 'reacted', 'shared'].includes(e.status)
    ).length;

    return {
      totalJourneys: this.journeys.length,
      activeJourneys,
      totalExperiences: this.experiences.length,
      scheduledExperiences,
      completedExperiences,
    };
  }
}
