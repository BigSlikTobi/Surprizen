import { Request, Response, NextFunction } from 'express';
import { GeminiService, GeminiMessage, GiftProfile, StrategyData } from '../services/geminiService';
import { ApiError } from '../middleware/errorHandler';

const geminiService = new GeminiService();

export interface StrategyChatRequest {
  message: string;
  conversationHistory: GeminiMessage[];
  currentProfile: GiftProfile;
  strategyData: StrategyData;
  visionHistory: GeminiMessage[];
}

export interface InitialStrategyRequest {
  giftProfile: GiftProfile;
  visionHistory: GeminiMessage[];
}

/**
 * Handle strategy chat conversation
 */
export const handleStrategyChat = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const { 
      message, 
      conversationHistory = [], 
      currentProfile = {},
      strategyData = {},
      visionHistory = []
    }: StrategyChatRequest = req.body;

    if (!message) {
      throw new ApiError(400, 'Message is required');
    }

    console.log('Strategy chat request:', {
      userId: req.user.uid,
      message: message.substring(0, 50) + '...',
      historyLength: conversationHistory.length,
      visionHistoryLength: visionHistory.length,
      strategyFields: Object.keys(strategyData).length,
    });

    // Add the user's message to the conversation history
    const updatedHistory: GeminiMessage[] = [
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    // Generate AI response using Gemini for strategy development
    const aiResponse = await geminiService.generateStrategyResponse(
      updatedHistory,
      currentProfile,
      strategyData,
      visionHistory
    );

    // Add the AI response to the conversation history
    const finalHistory: GeminiMessage[] = [
      ...updatedHistory,
      {
        role: 'model',
        parts: [{ text: aiResponse.text }],
      },
    ];

    // Update the strategy data with any new information
    const updatedStrategyData = {
      ...strategyData,
      ...aiResponse.strategyUpdate,
    };

    // Check if strategy development is complete
    const isComplete = geminiService.isStrategyComplete(updatedStrategyData);

    console.log('Strategy chat response generated:', {
      responseLength: aiResponse.text.length,
      quickRepliesCount: aiResponse.quickReplies?.length || 0,
      strategyUpdates: Object.keys(aiResponse.strategyUpdate || {}).length,
      isComplete,
    });

    res.status(200).json({
      success: true,
      data: {
        response: aiResponse.text,
        quickReplies: aiResponse.quickReplies || [],
        strategyData: updatedStrategyData,
        conversationHistory: finalHistory,
        isComplete,
      },
    });
  } catch (error) {
    console.error('Error in strategy chat:', error);
    next(error);
  }
};

/**
 * Get initial strategy chat prompt
 */
export const getInitialStrategyPrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const { giftProfile, visionHistory }: InitialStrategyRequest = req.body;

    if (!giftProfile) {
      throw new ApiError(400, 'Gift profile is required');
    }

    console.log('Initial strategy prompt request:', {
      userId: req.user.uid,
      profileFields: Object.keys(giftProfile).length,
      visionHistoryLength: visionHistory?.length || 0,
    });

    // Generate initial strategy prompt based on the completed vision
    const aiResponse = await geminiService.generateInitialStrategyPrompt(
      giftProfile,
      visionHistory || []
    );

    const initialResponse = {
      response: aiResponse.text,
      quickReplies: aiResponse.quickReplies || [],
      strategyData: aiResponse.strategyUpdate || {},
      conversationHistory: [
        {
          role: 'model',
          parts: [{ text: aiResponse.text }],
        },
      ],
      isComplete: false,
    };

    console.log('Initial strategy prompt generated:', {
      responseLength: aiResponse.text.length,
      quickRepliesCount: aiResponse.quickReplies?.length || 0,
    });

    res.status(200).json({
      success: true,
      data: initialResponse,
    });
  } catch (error) {
    console.error('Error generating initial strategy prompt:', error);
    next(error);
  }
};