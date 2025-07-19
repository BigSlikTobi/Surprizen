import { Request, Response, NextFunction } from 'express';
import { GeminiService, GeminiMessage, GiftProfile, StrategyData, GeneratedJourney } from '../services/geminiService';
import { ApiError } from '../middleware/errorHandler';

const geminiService = new GeminiService();

export interface GenerateJourneyRequest {
  giftProfile: GiftProfile;
  strategyData: StrategyData;
  conversationHistory: GeminiMessage[];
}

export interface UpdateJourneyRequest {
  journey: GeneratedJourney;
  updates: Partial<GeneratedJourney>;
}

/**
 * Generate a complete journey storyboard
 */
export const generateJourneyStoryboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const { giftProfile, strategyData, conversationHistory }: GenerateJourneyRequest = req.body;

    if (!giftProfile || !strategyData) {
      throw new ApiError(400, 'Gift profile and strategy data are required');
    }

    console.log('Journey generation request:', {
      userId: req.user.uid,
      profileFields: Object.keys(giftProfile).length,
      strategyFields: Object.keys(strategyData).length,
      historyLength: conversationHistory?.length || 0,
    });

    // Generate the journey using Gemini AI
    const generatedJourney = await geminiService.generateJourneyStoryboard(
      giftProfile,
      strategyData,
      conversationHistory || []
    );

    // Validate the generated journey structure
    const validation = geminiService.validateJourneyStructure(generatedJourney);
    
    if (!validation.isValid) {
      console.warn('Generated journey has validation errors:', validation.errors);
      // Continue anyway but log the issues
    }

    console.log('Journey generated successfully:', {
      journeyId: generatedJourney.id,
      title: generatedJourney.title,
      totalSteps: generatedJourney.totalSteps,
      estimatedDuration: generatedJourney.estimatedDuration,
      validationErrors: validation.errors.length,
    });

    res.status(200).json({
      success: true,
      data: {
        journey: generatedJourney,
        validation: validation,
      },
    });
  } catch (error) {
    console.error('Error generating journey storyboard:', error);
    next(error);
  }
};

/**
 * Update journey step order or content
 */
export const updateJourneyStoryboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const { journey, updates }: UpdateJourneyRequest = req.body;

    if (!journey || !updates) {
      throw new ApiError(400, 'Journey and updates are required');
    }

    console.log('Journey update request:', {
      userId: req.user.uid,
      journeyId: journey.id,
      updateFields: Object.keys(updates).length,
    });

    // Apply updates to the journey
    const updatedJourney: GeneratedJourney = {
      ...journey,
      ...updates,
      // Ensure steps are properly ordered if step order changed
      steps: updates.steps ? 
        updates.steps.map((step, index) => ({ ...step, order: index + 1 })) :
        journey.steps,
    };

    // Validate the updated journey structure
    const validation = geminiService.validateJourneyStructure(updatedJourney);

    console.log('Journey updated:', {
      journeyId: updatedJourney.id,
      validationErrors: validation.errors.length,
    });

    res.status(200).json({
      success: true,
      data: {
        journey: updatedJourney,
        validation: validation,
      },
    });
  } catch (error) {
    console.error('Error updating journey storyboard:', error);
    next(error);
  }
};

/**
 * Preview journey from recipient perspective
 */
export const previewJourney = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    const { journey }: { journey: GeneratedJourney } = req.body;

    if (!journey) {
      throw new ApiError(400, 'Journey is required');
    }

    console.log('Journey preview request:', {
      userId: req.user.uid,
      journeyId: journey.id,
      totalSteps: journey.totalSteps,
    });

    // Create a recipient-friendly preview of the journey
    const preview = {
      title: journey.title,
      description: journey.description,
      totalSteps: journey.totalSteps,
      estimatedDuration: journey.estimatedDuration,
      difficulty: journey.difficulty,
      steps: journey.steps.map(step => ({
        id: step.id,
        order: step.order,
        type: step.type,
        title: step.title,
        clue: step.clue,
        estimatedTime: step.estimatedTime,
        deliveryChannel: step.deliveryChannel,
        // Don't include answers or hints in preview
      })),
      finalGift: {
        type: journey.finalGift.type,
        title: journey.finalGift.title,
        description: journey.finalGift.description,
        // Don't include price in recipient preview
      },
      personalizedMessage: journey.personalizedMessage,
    };

    res.status(200).json({
      success: true,
      data: {
        preview,
      },
    });
  } catch (error) {
    console.error('Error generating journey preview:', error);
    next(error);
  }
};