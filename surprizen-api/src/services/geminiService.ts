import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GiftProfile {
  occasion?: string;
  budget?: string;
  recipientName?: string;
  recipientAge?: string;
  recipientInterests?: string[] | string; // Allow both string and array formats
  relationship?: string;
  tone?: string;
  giftType?: string;
  timeline?: string;
  specialRequests?: string;
}

export interface GeminiResponse {
  text: string;
  quickReplies?: Array<{ id: string; text: string; value: string }>;
  profileUpdate?: Partial<GiftProfile>;
  strategyUpdate?: Partial<StrategyData>;
  conversationComplete?: boolean;
}

export interface StrategyData {
  puzzleSteps?: number;
  puzzleTypes?: string[];
  difficulty?: string;
  channels?: string[];
  channelPreferences?: {
    primary: string;
    timing?: string;
    frequency?: string;
  };
  tone?: string;
  giftOptions?: GiftOption[];
  deliveryPreferences?: any;
  budgetAllocation?: {
    giftAmount?: number;
    serviceFee?: number;
    deliveryFee?: number;
  };
}

export interface GiftOption {
  id: string;
  type: 'physical' | 'digital' | 'experience';
  title: string;
  description: string;
  price: number;
  reasoning: string;
  availability: 'immediate' | 'scheduled' | 'custom';
}

export interface JourneyStep {
  id: string;
  order: number;
  type: string;
  title: string;
  clue: string;
  answer: string;
  hints: string[];
  deliveryChannel: string;
  estimatedTime: number; // in minutes
  media?: {
    type: 'image' | 'audio' | 'video';
    url?: string;
    description?: string;
  };
}

export interface GeneratedJourney {
  id: string;
  title: string;
  description: string;
  totalSteps: number;
  estimatedDuration: number; // in minutes
  difficulty: string;
  steps: JourneyStep[];
  finalGift: GiftOption;
  personalizedMessage: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemma-3n-e2b-it' });
  }

  /**
   * Generate a response for the vision chatbot conversation
   */
  async generateVisionResponse(
    messages: GeminiMessage[],
    currentProfile: GiftProfile
  ): Promise<GeminiResponse> {
    try {
      const systemPrompt = this.buildVisionSystemPrompt(currentProfile);
      const conversationHistory = this.formatConversationHistory(messages);

      const prompt = `${systemPrompt}\n\n${conversationHistory}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response to extract structured data
      return this.parseVisionResponse(text, currentProfile);
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Build the system prompt for the vision chatbot
   */
  private buildVisionSystemPrompt(currentProfile: GiftProfile): string {
    return `You are an AI assistant helping users create personalized gift journeys. Your role is to gather information about the gift recipient and occasion through natural conversation.

CURRENT PROFILE STATUS:
${JSON.stringify(currentProfile, null, 2)}

YOUR OBJECTIVES:
1. Gather the following information through natural conversation:
   - Occasion (birthday, anniversary, holiday, etc.)
   - Budget range
   - Recipient's name and age
   - Relationship to recipient
   - Recipient's interests and hobbies
   - Desired tone (fun, heartfelt, elegant, etc.)
   - Gift type preferences (physical, experience, digital)
   - Timeline for the gift

2. Ask ONE question at a time to avoid overwhelming the user
3. Be conversational, warm, and enthusiastic
4. Provide 2-4 quick reply options when appropriate
5. Build on previous answers to ask follow-up questions

RESPONSE FORMAT:
You must respond with a JSON object in this exact format:
{
  "text": "Your conversational response here",
  "quickReplies": [
    {"id": "1", "text": "Option 1", "value": "option1"},
    {"id": "2", "text": "Option 2", "value": "option2"}
  ],
  "profileUpdate": {
    "fieldName": "value"
  }
}

CONVERSATION RULES:
- Keep responses under 100 words
- Always include 2-4 quick reply options unless the conversation is complete
- Update the profile with any new information gathered
- Use emojis sparingly but appropriately
- Be encouraging and excited about helping create the perfect gift

EXAMPLE RESPONSES:
If user says "birthday":
{
  "text": "A birthday celebration! 🎉 That's wonderful. Who is this special gift for?",
  "quickReplies": [
    {"id": "1", "text": "My partner", "value": "partner"},
    {"id": "2", "text": "Family member", "value": "family"},
    {"id": "3", "text": "Close friend", "value": "friend"},
    {"id": "4", "text": "Colleague", "value": "colleague"}
  ],
  "profileUpdate": {
    "occasion": "Birthday"
  }
}`;
  }

  /**
   * Format conversation history for the prompt
   */
  private formatConversationHistory(messages: GeminiMessage[]): string {
    return messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.parts[0].text}`)
      .join('\n');
  }

  /**
   * Parse the Gemini response to extract structured data
   */
  private parseVisionResponse(text: string, currentProfile: GiftProfile): GeminiResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate the response structure
        if (parsed.text) {
          return {
            text: parsed.text,
            quickReplies: parsed.quickReplies || [],
            profileUpdate: parsed.profileUpdate || {},
            conversationComplete: parsed.conversationComplete || false,
          };
        }
      }

      // Fallback: if JSON parsing fails, return the raw text
      return {
        text: text,
        quickReplies: [],
        profileUpdate: {},
        conversationComplete: false,
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);

      // Fallback response
      return {
        text: "I'm here to help you create the perfect gift! Could you tell me more about what you have in mind?",
        quickReplies: [
          { id: '1', text: 'Birthday gift', value: 'birthday' },
          { id: '2', text: 'Anniversary gift', value: 'anniversary' },
          { id: '3', text: 'Holiday gift', value: 'holiday' },
          { id: '4', text: 'Just because', value: 'just_because' },
        ],
        profileUpdate: {},
        conversationComplete: false,
      };
    }
  }

  /**
   * Check if the vision gathering is complete
   */
  isVisionComplete(profile: GiftProfile): boolean {
    const requiredFields = ['occasion', 'relationship', 'budget'];
    const optionalFields = ['recipientAge', 'tone'];

    const hasRequired = requiredFields.every(field => profile[field as keyof GiftProfile]);
    const hasOptional = optionalFields.some(field => profile[field as keyof GiftProfile]);

    return hasRequired && hasOptional;
  }

  /**
   * Generate initial strategy prompt based on completed vision
   */
  async generateInitialStrategyPrompt(
    giftProfile: GiftProfile,
    visionHistory: GeminiMessage[]
  ): Promise<GeminiResponse> {
    try {
      const systemPrompt = this.buildInitialStrategySystemPrompt(giftProfile, visionHistory);

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response to extract structured data
      return this.parseStrategyResponse(text);
    } catch (error) {
      console.error('Error generating initial strategy prompt:', error);
      throw new Error('Failed to generate initial strategy prompt');
    }
  }

  /**
   * Generate a response for the strategy chatbot conversation
   */
  async generateStrategyResponse(
    messages: GeminiMessage[],
    currentProfile: GiftProfile,
    strategyData: StrategyData,
    visionHistory: GeminiMessage[]
  ): Promise<GeminiResponse> {
    try {
      // Check if we should generate gift recommendations
      const shouldGenerateGifts = this.shouldGenerateGiftRecommendations(strategyData);
      let giftRecommendations: GiftOption[] = [];
      
      if (shouldGenerateGifts && (!strategyData.giftOptions || strategyData.giftOptions.length === 0)) {
        giftRecommendations = this.generateGiftRecommendations(currentProfile, strategyData);
      }

      const systemPrompt = this.buildStrategySystemPrompt(currentProfile, strategyData, visionHistory, giftRecommendations);
      const conversationHistory = this.formatConversationHistory(messages);

      const prompt = `${systemPrompt}\n\n${conversationHistory}`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response to extract structured data
      const parsedResponse = this.parseStrategyResponse(text);
      
      // Add gift recommendations to strategy update if generated
      if (giftRecommendations.length > 0) {
        parsedResponse.strategyUpdate = {
          ...parsedResponse.strategyUpdate,
          giftOptions: giftRecommendations
        };
      }

      return parsedResponse;
    } catch (error) {
      console.error('Error generating strategy response:', error);
      throw new Error('Failed to generate strategy response');
    }
  }

  /**
   * Check if we should generate gift recommendations
   */
  private shouldGenerateGiftRecommendations(strategyData: StrategyData): boolean {
    // Generate recommendations when we have puzzle steps, types, and difficulty
    return !!(strategyData.puzzleSteps && strategyData.puzzleTypes && strategyData.difficulty);
  }

  /**
   * Build the initial strategy system prompt
   */
  private buildInitialStrategySystemPrompt(
    giftProfile: GiftProfile,
    visionHistory: GeminiMessage[]
  ): string {
    const visionSummary = this.formatConversationHistory(visionHistory);
    
    return `You are an AI assistant helping users develop a strategy for their personalized gift journey. The user has completed the vision phase and now needs to plan the surprise strategy.

COMPLETED GIFT PROFILE:
${JSON.stringify(giftProfile, null, 2)}

VISION CONVERSATION SUMMARY:
${visionSummary}

YOUR ROLE:
You are now transitioning from vision gathering to strategy development. Welcome the user to this new phase and start developing their surprise strategy.

STRATEGY OBJECTIVES:
1. Determine the number of puzzle steps (3-5 steps)
2. Set difficulty level (easy, medium, hard)
3. Choose delivery channels (email, SMS, physical)
4. Refine the tone and style
5. Generate initial gift recommendations

RESPONSE FORMAT:
You must respond with a JSON object in this exact format:
{
  "text": "Your welcoming transition message here",
  "quickReplies": [
    {"id": "1", "text": "Option 1", "value": "option1"},
    {"id": "2", "text": "Option 2", "value": "option2"}
  ],
  "strategyUpdate": {
    "fieldName": "value"
  }
}

CONVERSATION RULES:
- Welcome them to the strategy phase
- Reference their completed vision positively
- Start with the most important strategy decision (number of puzzle steps)
- Keep responses under 100 words
- Be enthusiastic about moving to the next phase
- Use the recipient's name if available

EXAMPLE RESPONSE:
{
  "text": "Perfect! I have everything I need about your vision for ${giftProfile.recipientName || 'the recipient'}. Now let's develop the strategy for your surprise journey! How many puzzle steps would you like to create for this ${giftProfile.occasion?.toLowerCase()} gift?",
  "quickReplies": [
    {"id": "1", "text": "3 steps (Quick & Sweet)", "value": "3"},
    {"id": "2", "text": "4 steps (Balanced)", "value": "4"},
    {"id": "3", "text": "5 steps (Extended Journey)", "value": "5"}
  ],
  "strategyUpdate": {}
}`;
  }

  /**
   * Build the system prompt for the strategy chatbot
   */
  private buildStrategySystemPrompt(
    currentProfile: GiftProfile,
    strategyData: StrategyData,
    visionHistory: GeminiMessage[],
    giftRecommendations: GiftOption[] = []
  ): string {
    return `You are an AI assistant helping users develop a strategy for their personalized gift journey.

GIFT PROFILE:
${JSON.stringify(currentProfile, null, 2)}

CURRENT STRATEGY DATA:
${JSON.stringify(strategyData, null, 2)}

YOUR OBJECTIVES:
1. Complete the strategy development by gathering:
   - Number of puzzle steps (3-5)
   - Puzzle types (riddles, photo challenges, location clues, trivia, creative tasks)
   - Difficulty level (easy, medium, hard)
   - Delivery channels (email, SMS, physical)
   - Channel preferences and timing
   - Tone refinement
   - Gift preferences and budget allocation

2. Ask ONE question at a time to avoid overwhelming the user
3. Build on previous strategy decisions logically
4. Provide contextual quick reply options based on their profile
5. Generate personalized gift recommendations when strategy is nearly complete
6. Explain the reasoning behind suggestions

RESPONSE FORMAT:
You must respond with a JSON object in this exact format:
{
  "text": "Your conversational response here",
  "quickReplies": [
    {"id": "1", "text": "Option 1", "value": "option1"},
    {"id": "2", "text": "Option 2", "value": "option2"}
  ],
  "strategyUpdate": {
    "fieldName": "value"
  }
}

CONVERSATION RULES:
- Keep responses under 100 words
- Always include 2-4 quick reply options
- Update strategy data with new decisions
- Be encouraging and collaborative
- Reference previous decisions to build continuity

STRATEGY FLOW:
1. Number of puzzle steps (3-5)
2. Puzzle types selection (riddles, photo challenges, location clues, trivia, creative tasks)
3. Difficulty level (easy, medium, hard)
4. Delivery channels (email, SMS, physical)
5. Channel preferences and timing
6. Gift recommendations with reasoning
7. Budget allocation confirmation
8. Final strategy confirmation

PUZZLE TYPES GUIDE:
- Riddles: Word puzzles, brain teasers, logic problems
- Photo Challenges: Take/find specific photos, visual scavenger hunts
- Location Clues: Visit specific places, GPS-based challenges
- Trivia: Questions about recipient's interests, shared memories
- Creative Tasks: Draw, write, create something specific

GIFT RECOMMENDATION RULES:
- Base recommendations on recipient's interests and relationship
- Consider the occasion and budget constraints
- Provide 2-3 options with different price points
- Explain why each gift fits the recipient
- Include mix of physical, digital, and experience options when appropriate
- Factor in timeline and delivery preferences`;
  }

  /**
   * Parse the strategy response to extract structured data
   */
  private parseStrategyResponse(text: string): GeminiResponse {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        // Validate the response structure
        if (parsed.text) {
          return {
            text: parsed.text,
            quickReplies: parsed.quickReplies || [],
            strategyUpdate: parsed.strategyUpdate || {},
            conversationComplete: parsed.conversationComplete || false,
          };
        }
      }

      // Fallback: if JSON parsing fails, return the raw text
      return {
        text: text,
        quickReplies: [],
        strategyUpdate: {},
        conversationComplete: false,
      };
    } catch (error) {
      console.error('Error parsing strategy response:', error);

      // Fallback response
      return {
        text: "Let's continue developing your strategy. What would you like to decide next?",
        quickReplies: [
          { id: '1', text: '3 puzzle steps', value: '3' },
          { id: '2', text: '4 puzzle steps', value: '4' },
          { id: '3', text: '5 puzzle steps', value: '5' },
        ],
        strategyUpdate: {},
        conversationComplete: false,
      };
    }
  }

  /**
   * Check if the strategy development is complete
   */
  isStrategyComplete(strategyData: StrategyData): boolean {
    const requiredFields = ['puzzleSteps', 'puzzleTypes', 'difficulty', 'channels'];
    const optionalFields = ['giftOptions', 'channelPreferences'];
    
    const hasRequired = requiredFields.every(field => {
      const value = strategyData[field as keyof StrategyData];
      if (field === 'puzzleTypes' || field === 'channels') {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== null && value !== '';
    });
    
    const hasOptional = optionalFields.some(field => {
      const value = strategyData[field as keyof StrategyData];
      if (field === 'giftOptions') {
        return Array.isArray(value) && value.length > 0;
      }
      return value !== undefined && value !== null;
    });
    
    return hasRequired && hasOptional;
  }

  /**
   * Generate gift recommendations based on profile and strategy
   */
  generateGiftRecommendations(
    giftProfile: GiftProfile,
    strategyData: StrategyData
  ): GiftOption[] {
    const recommendations: GiftOption[] = [];
    const budget = this.parseBudget(giftProfile.budget || '');
    const interests = Array.isArray(giftProfile.recipientInterests) 
      ? giftProfile.recipientInterests 
      : [giftProfile.recipientInterests || ''];

    // Generate recommendations based on interests and budget
    if (interests.includes('books') || interests.includes('reading')) {
      recommendations.push({
        id: 'book-collection',
        type: 'physical',
        title: 'Curated Book Collection',
        description: 'A personalized selection of books based on their interests',
        price: Math.min(budget * 0.7, 75),
        reasoning: 'Perfect for book lovers, allows for personal curation',
        availability: 'immediate'
      });
    }

    if (interests.includes('music') || interests.includes('concerts')) {
      recommendations.push({
        id: 'music-experience',
        type: 'experience',
        title: 'Concert or Music Experience',
        description: 'Tickets to a favorite artist or music experience',
        price: Math.min(budget * 0.8, 150),
        reasoning: 'Creates lasting memories for music enthusiasts',
        availability: 'scheduled'
      });
    }

    if (interests.includes('food') || interests.includes('cooking')) {
      recommendations.push({
        id: 'culinary-kit',
        type: 'physical',
        title: 'Gourmet Cooking Kit',
        description: 'Premium ingredients and tools for culinary adventures',
        price: Math.min(budget * 0.6, 100),
        reasoning: 'Combines their love of food with hands-on experience',
        availability: 'immediate'
      });
    }

    // Default recommendations if no specific interests match
    if (recommendations.length === 0) {
      recommendations.push(
        {
          id: 'experience-voucher',
          type: 'experience',
          title: 'Experience Voucher',
          description: 'Flexible voucher for activities they can choose',
          price: Math.min(budget * 0.7, 100),
          reasoning: 'Gives them the freedom to choose their own adventure',
          availability: 'immediate'
        },
        {
          id: 'personalized-gift',
          type: 'physical',
          title: 'Personalized Keepsake',
          description: 'Custom item reflecting your relationship and memories',
          price: Math.min(budget * 0.5, 75),
          reasoning: 'Meaningful and personal, perfect for any relationship',
          availability: 'custom'
        }
      );
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  /**
   * Generate a complete journey storyboard based on profile and strategy
   */
  async generateJourneyStoryboard(
    giftProfile: GiftProfile,
    strategyData: StrategyData,
    conversationHistory: GeminiMessage[]
  ): Promise<GeneratedJourney> {
    try {
      const systemPrompt = this.buildJourneyGenerationPrompt(giftProfile, strategyData, conversationHistory);

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      // Parse the response to extract structured journey data
      return this.parseJourneyResponse(text, giftProfile, strategyData);
    } catch (error) {
      console.error('Error generating journey storyboard:', error);
      throw new Error('Failed to generate journey storyboard');
    }
  }

  /**
   * Build the system prompt for journey generation
   */
  private buildJourneyGenerationPrompt(
    giftProfile: GiftProfile,
    strategyData: StrategyData,
    conversationHistory: GeminiMessage[]
  ): string {
    const selectedGift = strategyData.giftOptions?.[0] || this.generateGiftRecommendations(giftProfile, strategyData)[0];
    
    return `You are an AI assistant that creates detailed, personalized gift journey storyboards. Generate a complete puzzle journey based on the user's profile and strategy.

GIFT PROFILE:
${JSON.stringify(giftProfile, null, 2)}

STRATEGY DATA:
${JSON.stringify(strategyData, null, 2)}

SELECTED GIFT:
${JSON.stringify(selectedGift, null, 2)}

YOUR TASK:
Create a ${strategyData.puzzleSteps || 4}-step puzzle journey that leads to the final gift reveal. Each step should be engaging, personalized, and appropriate for the relationship and occasion.

PUZZLE TYPES TO USE:
${strategyData.puzzleTypes?.join(', ') || 'riddles, photo challenges, trivia'}

DIFFICULTY LEVEL: ${strategyData.difficulty || 'medium'}

RESPONSE FORMAT:
You must respond with a JSON object in this exact format:
{
  "title": "Journey title (e.g., 'Sarah's Birthday Adventure')",
  "description": "Brief description of the journey theme",
  "steps": [
    {
      "order": 1,
      "type": "riddle",
      "title": "Step title",
      "clue": "The puzzle/clue text",
      "answer": "Expected answer",
      "hints": ["Hint 1", "Hint 2", "Hint 3"],
      "deliveryChannel": "email",
      "estimatedTime": 10
    }
  ],
  "personalizedMessage": "Final message from gift giver to recipient"
}

JOURNEY CREATION RULES:
1. Make each step build on the previous one
2. Include personal references from the profile (interests, relationship, occasion)
3. Vary puzzle types across steps
4. Ensure answers are clear and unambiguous
5. Provide 3 progressive hints for each step
6. Estimate realistic completion times (5-15 minutes per step)
7. Use the specified delivery channels
8. Create a cohesive narrative thread
9. End with a heartfelt personalized message

EXAMPLE STEP TYPES:
- Riddle: "I have keys but no locks, space but no room. What am I?" (Answer: keyboard)
- Photo Challenge: "Take a photo of something that represents our friendship"
- Location Clue: "Go to the place where we first met"
- Trivia: "What's my favorite movie that we watched together?"
- Creative Task: "Draw a picture of your happiest memory with me"

Make the journey feel personal, engaging, and appropriate for a ${giftProfile.relationship} giving a ${giftProfile.occasion} gift.`;
  }

  /**
   * Parse the journey generation response
   */
  private parseJourneyResponse(
    text: string,
    giftProfile: GiftProfile,
    strategyData: StrategyData
  ): GeneratedJourney {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.title && parsed.steps) {
          const steps: JourneyStep[] = parsed.steps.map((step: any, index: number) => ({
            id: `step-${index + 1}`,
            order: step.order || index + 1,
            type: step.type || 'riddle',
            title: step.title || `Step ${index + 1}`,
            clue: step.clue || '',
            answer: step.answer || '',
            hints: step.hints || [],
            deliveryChannel: step.deliveryChannel || strategyData.channelPreferences?.primary || 'email',
            estimatedTime: step.estimatedTime || 10,
            media: step.media
          }));

          const totalDuration = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
          const selectedGift = strategyData.giftOptions?.[0] || this.generateGiftRecommendations(giftProfile, strategyData)[0];

          return {
            id: `journey-${Date.now()}`,
            title: parsed.title,
            description: parsed.description || `A personalized ${giftProfile.occasion} journey for ${giftProfile.recipientName}`,
            totalSteps: steps.length,
            estimatedDuration: totalDuration,
            difficulty: strategyData.difficulty || 'medium',
            steps,
            finalGift: selectedGift,
            personalizedMessage: parsed.personalizedMessage || `Happy ${giftProfile.occasion}! I hope you enjoyed this special journey I created just for you.`
          };
        }
      }

      // Fallback: create a basic journey structure
      return this.createFallbackJourney(giftProfile, strategyData);
    } catch (error) {
      console.error('Error parsing journey response:', error);
      return this.createFallbackJourney(giftProfile, strategyData);
    }
  }

  /**
   * Create a fallback journey when AI generation fails
   */
  private createFallbackJourney(giftProfile: GiftProfile, strategyData: StrategyData): GeneratedJourney {
    const numSteps = strategyData.puzzleSteps || 4;
    const steps: JourneyStep[] = [];

    for (let i = 0; i < numSteps; i++) {
      steps.push({
        id: `step-${i + 1}`,
        order: i + 1,
        type: 'riddle',
        title: `Puzzle Step ${i + 1}`,
        clue: `This is puzzle step ${i + 1} of your journey. Solve this to continue!`,
        answer: `answer${i + 1}`,
        hints: [
          `Hint 1 for step ${i + 1}`,
          `Hint 2 for step ${i + 1}`,
          `Hint 3 for step ${i + 1}`
        ],
        deliveryChannel: strategyData.channelPreferences?.primary || 'email',
        estimatedTime: 10
      });
    }

    const selectedGift = strategyData.giftOptions?.[0] || this.generateGiftRecommendations(giftProfile, strategyData)[0];

    return {
      id: `journey-${Date.now()}`,
      title: `${giftProfile.recipientName}'s ${giftProfile.occasion} Journey`,
      description: `A personalized puzzle journey created especially for ${giftProfile.recipientName}`,
      totalSteps: numSteps,
      estimatedDuration: numSteps * 10,
      difficulty: strategyData.difficulty || 'medium',
      steps,
      finalGift: selectedGift,
      personalizedMessage: `Happy ${giftProfile.occasion}! I created this special journey just for you. I hope you enjoy every step!`
    };
  }

  /**
   * Validate journey JSON structure
   */
  validateJourneyStructure(journey: GeneratedJourney): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!journey.id) errors.push('Journey ID is required');
    if (!journey.title) errors.push('Journey title is required');
    if (!journey.steps || journey.steps.length === 0) errors.push('Journey must have at least one step');
    
    journey.steps?.forEach((step, index) => {
      if (!step.id) errors.push(`Step ${index + 1}: ID is required`);
      if (!step.clue) errors.push(`Step ${index + 1}: Clue is required`);
      if (!step.answer) errors.push(`Step ${index + 1}: Answer is required`);
      if (!step.hints || step.hints.length === 0) errors.push(`Step ${index + 1}: At least one hint is required`);
    });

    if (!journey.finalGift) errors.push('Final gift is required');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Parse budget string to number
   */
  private parseBudget(budgetStr: string): number {
    const match = budgetStr.match(/\d+/);
    return match ? parseInt(match[0]) : 50; // Default to $50 if can't parse
  }
}