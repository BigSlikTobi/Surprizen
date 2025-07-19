import { Request, Response, NextFunction } from 'express';
import { GeminiService, GeminiMessage, GiftProfile } from '../services/geminiService';
import { ApiError } from '../middleware/errorHandler';

const geminiService = new GeminiService();

export interface VisionChatRequest {
  message: string;
  conversationHistory: GeminiMessage[];
  currentProfile: GiftProfile;
}

/**
 * Handle vision chat conversation
 */
export const handleVisionChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const { message, conversationHistory = [], currentProfile = {} }: VisionChatRequest = req.body;

    if (!message) {
      throw new ApiError(400, 'Message is required');
    }

    console.log('Vision chat request:', {
      userId: req.user.uid,
      message: message.substring(0, 50) + '...',
      historyLength: conversationHistory.length,
      profileFields: Object.keys(currentProfile).length,
    });

    // Add the user's message to the conversation history
    const updatedHistory: GeminiMessage[] = [
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    // Generate AI response using Gemini
    const aiResponse = await geminiService.generateVisionResponse(
      updatedHistory,
      currentProfile
    );

    // Add the AI response to the conversation history
    const finalHistory: GeminiMessage[] = [
      ...updatedHistory,
      {
        role: 'model',
        parts: [{ text: aiResponse.text }],
      },
    ];

    // Update the profile with any new information
    const updatedProfile = {
      ...currentProfile,
      ...aiResponse.profileUpdate,
    };

    // Check if vision gathering is complete
    const isComplete = geminiService.isVisionComplete(updatedProfile);

    console.log('Vision chat response generated:', {
      responseLength: aiResponse.text.length,
      quickRepliesCount: aiResponse.quickReplies?.length || 0,
      profileUpdates: Object.keys(aiResponse.profileUpdate || {}).length,
      isComplete,
    });

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse.text,
        quickReplies: aiResponse.quickReplies || [],
        updatedProfile,
        conversationHistory: finalHistory,
        isComplete,
      },
    });
  } catch (error) {
    console.error('Error in vision chat:', error);
    next(error);
  }
};

/**
 * Get initial vision chat prompt
 */
export const getInitialVisionPrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const welcomeMessage = "Hi! I'm here to help you create the perfect gift journey. Let's start by learning about what you have in mind. What's the occasion for this gift?";

    const initialResponse = {
      response: welcomeMessage,
      quickReplies: [
        { id: '1', text: 'Birthday', value: 'birthday' },
        { id: '2', text: 'Anniversary', value: 'anniversary' },
        { id: '3', text: 'Holiday', value: 'holiday' },
        { id: '4', text: 'Just Because', value: 'just_because' },
        { id: '5', text: 'Other', value: 'other' },
      ],
      updatedProfile: {},
      conversationHistory: [
        {
          role: 'model',
          parts: [{ text: welcomeMessage }],
        },
      ],
      isComplete: false,
    };

    res.status(200).json({
      success: true,
      data: initialResponse,
    });
  } catch (error) {
    next(error);
  }
};