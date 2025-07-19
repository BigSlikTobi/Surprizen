import { ExperienceContent, VoucherDetails } from '../models/Experience';
import { RecipientPersona } from '../models/Journey';

export interface ContentTemplate {
  id: string;
  type: 'text' | 'image' | 'video' | 'voucher';
  category: string;
  template: string;
  placeholders: string[];
  themes: string[];
  intensity: string[];
}

export interface ImageAsset {
  id: string;
  url: string;
  category: string;
  tags: string[];
  themes: string[];
}

export class ContentGenerationService {
  private textTemplates: ContentTemplate[] = [
    {
      id: 'morning_motivation',
      type: 'text',
      category: 'motivational',
      template: 'Good morning {recipientName}! 🌅 Today is going to be amazing because you are {personalityTrait}. Remember: {motivationalQuote}',
      placeholders: ['recipientName', 'personalityTrait', 'motivationalQuote'],
      themes: ['inspirational', 'motivational'],
      intensity: ['subtle', 'moderate'],
    },
    {
      id: 'interest_appreciation',
      type: 'text',
      category: 'personal',
      template: 'I love how passionate you are about {interest}! {appreciationMessage} 💫',
      placeholders: ['interest', 'appreciationMessage'],
      themes: ['fun', 'nostalgic'],
      intensity: ['subtle', 'moderate', 'immersive'],
    },
    {
      id: 'memory_share',
      type: 'text',
      category: 'nostalgic',
      template: 'Remember when {memoryDescription}? That moment showed me how {personalityTrait} you are. {emotionalMessage} ❤️',
      placeholders: ['memoryDescription', 'personalityTrait', 'emotionalMessage'],
      themes: ['nostalgic', 'romantic'],
      intensity: ['moderate', 'immersive'],
    },
    {
      id: 'daily_encouragement',
      type: 'text',
      category: 'supportive',
      template: 'Hey {recipientName}! Just wanted to remind you that you\'re doing great. Your {strength} always inspires me! 🌟',
      placeholders: ['recipientName', 'strength'],
      themes: ['inspirational', 'fun'],
      intensity: ['subtle'],
    },
    {
      id: 'surprise_announcement',
      type: 'text',
      category: 'exciting',
      template: 'Surprise! 🎉 I have something special planned for you because {reason}. Get ready for {hint}!',
      placeholders: ['reason', 'hint'],
      themes: ['fun', 'romantic'],
      intensity: ['moderate', 'immersive'],
    },
  ];

  private imageAssets: ImageAsset[] = [
    {
      id: 'sunset_motivation',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
      category: 'nature',
      tags: ['sunset', 'mountains', 'inspiration'],
      themes: ['inspirational', 'motivational'],
    },
    {
      id: 'coffee_morning',
      url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
      category: 'lifestyle',
      tags: ['coffee', 'morning', 'cozy'],
      themes: ['fun', 'nostalgic'],
    },
    {
      id: 'heart_hands',
      url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7',
      category: 'romantic',
      tags: ['hands', 'heart', 'love'],
      themes: ['romantic', 'nostalgic'],
    },
    {
      id: 'celebration_confetti',
      url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
      category: 'celebration',
      tags: ['confetti', 'party', 'celebration'],
      themes: ['fun', 'inspirational'],
    },
  ];

  private voucherTemplates = [
    {
      type: 'coffee',
      title: 'Coffee Date Voucher',
      description: 'Redeemable for one coffee date at your favorite café',
      merchantName: 'Local Coffee Shop',
    },
    {
      type: 'movie',
      title: 'Movie Night Voucher',
      description: 'Good for one movie night with snacks included',
      merchantName: 'Home Cinema',
    },
    {
      type: 'dinner',
      title: 'Dinner Date Voucher',
      description: 'Redeemable for a special dinner at a restaurant of your choice',
      merchantName: 'Restaurant Choice',
    },
    {
      type: 'experience',
      title: 'Adventure Voucher',
      description: 'Good for one fun activity or experience together',
      merchantName: 'Adventure Co.',
    },
  ];

  private motivationalQuotes = [
    'Every day is a new opportunity to shine',
    'Your potential is limitless',
    'Small steps lead to big changes',
    'You are stronger than you think',
    'Today is your day to sparkle',
  ];

  private appreciationMessages = [
    'It makes you so unique and special',
    'Your enthusiasm is contagious',
    'You inspire everyone around you',
    'It\'s one of the things I admire most about you',
    'You have such a gift for it',
  ];

  private emotionalMessages = [
    'Those are the moments I treasure most',
    'It\'s memories like these that make life beautiful',
    'I smile every time I think about it',
    'That\'s when I knew how special you are',
    'These moments mean everything to me',
  ];

  /**
   * Generate text content based on persona and preferences
   */
  async generateTextContent(
    persona: RecipientPersona,
    theme: string,
    intensity: string,
    recipientName: string
  ): Promise<ExperienceContent> {
    try {
      // Find suitable templates
      const suitableTemplates = this.textTemplates.filter(
        template => 
          template.themes.includes(theme) && 
          template.intensity.includes(intensity)
      );

      if (suitableTemplates.length === 0) {
        throw new Error('No suitable text templates found');
      }

      // Select random template
      const template = suitableTemplates[Math.floor(Math.random() * suitableTemplates.length)];

      // Generate personalized content
      let personalizedText = template.template;

      // Replace placeholders
      personalizedText = personalizedText.replace('{recipientName}', recipientName);
      
      if (template.placeholders.includes('personalityTrait')) {
        const trait = persona.personality[Math.floor(Math.random() * persona.personality.length)] || 'amazing';
        personalizedText = personalizedText.replace('{personalityTrait}', trait);
      }

      if (template.placeholders.includes('interest')) {
        const interest = persona.interests[Math.floor(Math.random() * persona.interests.length)] || 'your hobbies';
        personalizedText = personalizedText.replace('{interest}', interest);
      }

      if (template.placeholders.includes('motivationalQuote')) {
        const quote = this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
        personalizedText = personalizedText.replace('{motivationalQuote}', quote);
      }

      if (template.placeholders.includes('appreciationMessage')) {
        const message = this.appreciationMessages[Math.floor(Math.random() * this.appreciationMessages.length)];
        personalizedText = personalizedText.replace('{appreciationMessage}', message);
      }

      if (template.placeholders.includes('emotionalMessage')) {
        const message = this.emotionalMessages[Math.floor(Math.random() * this.emotionalMessages.length)];
        personalizedText = personalizedText.replace('{emotionalMessage}', message);
      }

      if (template.placeholders.includes('strength')) {
        const strength = persona.personality[0] || 'determination';
        personalizedText = personalizedText.replace('{strength}', strength);
      }

      if (template.placeholders.includes('reason')) {
        const reason = `you're so ${persona.personality[0] || 'wonderful'}`;
        personalizedText = personalizedText.replace('{reason}', reason);
      }

      if (template.placeholders.includes('hint')) {
        const hint = 'something that matches your interests';
        personalizedText = personalizedText.replace('{hint}', hint);
      }

      if (template.placeholders.includes('memoryDescription')) {
        const memory = 'we spent that amazing time together';
        personalizedText = personalizedText.replace('{memoryDescription}', memory);
      }

      return {
        title: this.generateTitle(template.category, recipientName),
        description: personalizedText,
        text: personalizedText,
        personalizationTokens: {
          templateId: template.id,
          theme,
          intensity,
          recipientName,
        },
        estimatedEngagementTime: this.calculateEstimatedEngagementTime(personalizedText),
      };
    } catch (error) {
      console.error('Error generating text content:', error);
      throw new Error('Failed to generate text content');
    }
  }

  /**
   * Select image based on theme and persona
   */
  async selectImage(theme: string, persona: RecipientPersona): Promise<ExperienceContent> {
    try {
      // Find suitable images
      const suitableImages = this.imageAssets.filter(image => 
        image.themes.includes(theme)
      );

      if (suitableImages.length === 0) {
        throw new Error('No suitable images found');
      }

      // Select image based on persona interests if possible
      let selectedImage = suitableImages[0];
      
      for (const image of suitableImages) {
        const hasMatchingTag = image.tags.some(tag => 
          persona.interests.some(interest => 
            interest.toLowerCase().includes(tag.toLowerCase())
          )
        );
        
        if (hasMatchingTag) {
          selectedImage = image;
          break;
        }
      }

      // If no matching interests, select randomly
      if (!selectedImage) {
        selectedImage = suitableImages[Math.floor(Math.random() * suitableImages.length)];
      }

      return {
        title: this.generateImageTitle(selectedImage.category),
        description: `A beautiful ${selectedImage.category} image selected just for you`,
        mediaUrl: selectedImage.url,
        mediaType: 'image',
        personalizationTokens: {
          imageId: selectedImage.id,
          theme,
          category: selectedImage.category,
          tags: selectedImage.tags,
        },
        estimatedEngagementTime: 15, // 15 seconds for image viewing
      };
    } catch (error) {
      console.error('Error selecting image:', error);
      throw new Error('Failed to select image');
    }
  }

  /**
   * Generate voucher content
   */
  async generateVoucher(
    persona: RecipientPersona,
    theme: string,
    recipientName: string
  ): Promise<ExperienceContent> {
    try {
      // Select voucher type based on persona interests
      let voucherType = 'experience'; // default
      
      if (persona.interests.some(interest => 
        ['coffee', 'café', 'drinks'].some(keyword => 
          interest.toLowerCase().includes(keyword)
        )
      )) {
        voucherType = 'coffee';
      } else if (persona.interests.some(interest => 
        ['movies', 'films', 'cinema'].some(keyword => 
          interest.toLowerCase().includes(keyword)
        )
      )) {
        voucherType = 'movie';
      } else if (persona.interests.some(interest => 
        ['food', 'dining', 'restaurants'].some(keyword => 
          interest.toLowerCase().includes(keyword)
        )
      )) {
        voucherType = 'dinner';
      }

      const template = this.voucherTemplates.find(v => v.type === voucherType) || this.voucherTemplates[0];

      const voucherDetails: VoucherDetails = {
        type: 'experience',
        title: template.title,
        description: template.description,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        redemptionCode: this.generateRedemptionCode(),
        terms: [
          'Valid for 30 days from issue date',
          'Cannot be exchanged for cash',
          'Must be redeemed together',
        ],
        merchantName: template.merchantName,
      };

      return {
        title: `Special Voucher for ${recipientName}`,
        description: `A personalized voucher created just for you!`,
        voucherDetails,
        personalizationTokens: {
          voucherType,
          theme,
          recipientName,
          generatedAt: new Date().toISOString(),
        },
        estimatedEngagementTime: 30, // 30 seconds to read voucher details
      };
    } catch (error) {
      console.error('Error generating voucher:', error);
      throw new Error('Failed to generate voucher');
    }
  }

  /**
   * Validate content for safety and appropriateness
   */
  async validateContent(content: ExperienceContent): Promise<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    try {
      // Check for inappropriate content
      const inappropriateWords = ['hate', 'stupid', 'ugly', 'worthless'];
      const contentText = (content.text || content.description || '').toLowerCase();

      for (const word of inappropriateWords) {
        if (contentText.includes(word)) {
          issues.push(`Contains inappropriate word: ${word}`);
        }
      }

      // Check content length
      if (content.text && content.text.length > 500) {
        issues.push('Text content is too long (max 500 characters)');
        suggestions.push('Consider shortening the message for better engagement');
      }

      if (content.text && content.text.length < 10) {
        issues.push('Text content is too short (min 10 characters)');
        suggestions.push('Add more personalized details to make it meaningful');
      }

      // Check for personalization
      if (content.text && !content.personalizationTokens) {
        suggestions.push('Consider adding personalization tokens for better tracking');
      }

      // Validate voucher details
      if (content.voucherDetails) {
        if (!content.voucherDetails.expiryDate) {
          issues.push('Voucher missing expiry date');
        } else if (content.voucherDetails.expiryDate < new Date()) {
          issues.push('Voucher expiry date is in the past');
        }

        if (!content.voucherDetails.redemptionCode) {
          issues.push('Voucher missing redemption code');
        }
      }

      // Validate media URLs
      if (content.mediaUrl) {
        try {
          new URL(content.mediaUrl);
        } catch {
          issues.push('Invalid media URL format');
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        suggestions,
      };
    } catch (error) {
      console.error('Error validating content:', error);
      return {
        isValid: false,
        issues: ['Content validation failed'],
        suggestions: ['Please review the content and try again'],
      };
    }
  }

  /**
   * Generate content based on type and parameters
   */
  async generateContent(
    type: 'text' | 'image' | 'voucher',
    persona: RecipientPersona,
    theme: string,
    intensity: string,
    recipientName: string
  ): Promise<ExperienceContent> {
    switch (type) {
      case 'text':
        return await this.generateTextContent(persona, theme, intensity, recipientName);
      case 'image':
        return await this.selectImage(theme, persona);
      case 'voucher':
        return await this.generateVoucher(persona, theme, recipientName);
      default:
        throw new Error(`Unsupported content type: ${type}`);
    }
  }

  /**
   * Private helper methods
   */
  private generateTitle(category: string, recipientName: string): string {
    const titles: Record<string, string[]> = {
      motivational: [`Good Morning ${recipientName}!`, `You've Got This!`, `Daily Inspiration`],
      personal: [`Just for You`, `Thinking of You`, `Personal Message`],
      nostalgic: [`Sweet Memories`, `Remember When...`, `Looking Back`],
      supportive: [`You're Amazing!`, `Daily Encouragement`, `Supportive Words`],
      exciting: [`Surprise!`, `Something Special`, `Exciting News`],
    };

    const categoryTitles = titles[category] || [`Message for ${recipientName}`];
    return categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
  }

  private generateImageTitle(category: string): string {
    const titles: Record<string, string[]> = {
      nature: ['Beautiful Nature', 'Scenic View', 'Natural Beauty'],
      lifestyle: ['Cozy Moments', 'Daily Life', 'Simple Pleasures'],
      romantic: ['With Love', 'From the Heart', 'Romantic Gesture'],
      celebration: ['Celebration Time!', 'Party Vibes', 'Festive Mood'],
    };

    const categoryTitles = titles[category] || ['Special Image'];
    return categoryTitles[Math.floor(Math.random() * categoryTitles.length)];
  }

  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private calculateEstimatedEngagementTime(text: string): number {
    // Estimate reading time: average 200 words per minute
    const words = text.split(' ').length;
    const readingTimeSeconds = Math.max(5, (words / 200) * 60);
    return Math.round(readingTimeSeconds);
  }
}