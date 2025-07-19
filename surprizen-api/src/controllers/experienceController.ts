import { Request, Response, NextFunction } from 'express';
import { ExperienceModel, Experience, Reaction } from '../models/Experience';
import { ApiError } from '../middleware/errorHandler';
import { body, param, query, validationResult } from 'express-validator';

export class ExperienceController {
  private experienceModel = new ExperienceModel();

  /**
   * Get experiences for recipient
   * GET /api/v1/experiences/recipient/:id
   */
  getRecipientExperiences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ApiError(400, 'Validation failed'));
      }

      const recipientId = req.params.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      const experiences = await this.experienceModel.getByRecipientId(recipientId, limit);

      res.json({
        success: true,
        data: experiences,
        count: experiences.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current experience for recipient
   * GET /api/v1/experiences/current
   */
  getCurrentExperience = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const recipientId = req.query.recipientId as string;
      
      if (!recipientId) {
        return next(new ApiError(400, 'Recipient ID is required'));
      }

      const currentExperience = await this.experienceModel.getCurrentExperience(recipientId);

      if (!currentExperience) {
        return res.json({
          success: true,
          data: null,
          message: 'No current experience found',
        });
      }

      res.json({
        success: true,
        data: currentExperience,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add reaction to experience
   * POST /api/v1/experiences/:id/reaction
   */
  addReaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ApiError(400, 'Validation failed'));
      }

      const experienceId = req.params.id;
      const { type, emoji, recipientId, details, shared, sharingPlatforms } = req.body;

      const reactionData: Omit<Reaction, 'id'> = {
        experienceId,
        recipientId,
        type,
        emoji,
        timestamp: new Date(),
        details,
        shared: shared || false,
        sharingPlatforms: sharingPlatforms || [],
      };

      const updatedExperience = await this.experienceModel.addReaction(experienceId, reactionData);

      if (!updatedExperience) {
        return next(new ApiError(404, 'Experience not found'));
      }

      // Update adaptation data based on reaction
      const adaptationUpdate = {
        engagementScore: this.calculateEngagementScore(type),
        reactionType: type,
        shared: shared || false,
        sharingPlatforms: sharingPlatforms || [],
        feedbackProvided: true,
        adaptationTriggers: [`reaction_${type}`],
      };

      await this.experienceModel.updateAdaptationData(experienceId, adaptationUpdate);

      res.json({
        success: true,
        data: updatedExperience,
        message: 'Reaction added successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update experience status
   * PATCH /api/v1/experiences/:id/status
   */
  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ApiError(400, 'Validation failed'));
      }

      const experienceId = req.params.id;
      const { status, timeSpentViewing } = req.body;

      const updatedExperience = await this.experienceModel.updateStatus(experienceId, status);

      if (!updatedExperience) {
        return next(new ApiError(404, 'Experience not found'));
      }

      // Update adaptation data if viewing time is provided
      if (timeSpentViewing && status === 'viewed') {
        const adaptationUpdate = {
          timeSpentViewing,
          engagementScore: this.calculateEngagementFromViewTime(timeSpentViewing),
          adaptationTriggers: [`status_${status}`],
        };

        await this.experienceModel.updateAdaptationData(experienceId, adaptationUpdate);
      }

      res.json({
        success: true,
        data: updatedExperience,
        message: 'Experience status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get experience by ID
   * GET /api/v1/experiences/:id
   */
  getExperienceById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const experienceId = req.params.id;

      const experience = await this.experienceModel.getById(experienceId);

      if (!experience) {
        return next(new ApiError(404, 'Experience not found'));
      }

      res.json({
        success: true,
        data: experience,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get experiences for a journey
   * GET /api/v1/experiences/journey/:id
   */
  getJourneyExperiences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const journeyId = req.params.id;
      const userId = req.user?.uid;

      if (!userId) {
        return next(new ApiError(401, 'User not authenticated'));
      }

      const experiences = await this.experienceModel.getByJourneyId(journeyId);

      // Filter experiences to only show those created by the authenticated user
      const userExperiences = experiences.filter(exp => exp.createdById === userId);

      res.json({
        success: true,
        data: userExperiences,
        count: userExperiences.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Set current step for recipient
   * POST /api/v1/experiences/:id/set-current
   */
  setCurrentStep = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const experienceId = req.params.id;
      const { recipientId } = req.body;

      if (!recipientId) {
        return next(new ApiError(400, 'Recipient ID is required'));
      }

      const success = await this.experienceModel.setCurrentStep(recipientId, experienceId);

      if (!success) {
        return next(new ApiError(500, 'Failed to set current step'));
      }

      res.json({
        success: true,
        message: 'Current step updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Calculate engagement score based on reaction type
   */
  private calculateEngagementScore(reactionType: string): number {
    const scores: Record<string, number> = {
      'love': 10,
      'heart': 10,
      'fire': 9,
      'wow': 8,
      'clap': 8,
      'like': 7,
      'laugh': 6,
      'sad': 4,
      'angry': 2,
    };

    return scores[reactionType] || 5;
  }

  /**
   * Calculate engagement score based on viewing time
   */
  private calculateEngagementFromViewTime(timeSpentViewing: number): number {
    // Convert seconds to engagement score (0-10)
    if (timeSpentViewing < 5) return 2;
    if (timeSpentViewing < 15) return 5;
    if (timeSpentViewing < 30) return 7;
    if (timeSpentViewing < 60) return 8;
    return 10;
  }
}

// Validation middleware
export const reactionValidation = [
  param('id').isString().notEmpty().withMessage('Experience ID is required'),
  body('type')
    .isIn(['love', 'like', 'laugh', 'wow', 'sad', 'angry', 'heart', 'fire', 'clap'])
    .withMessage('Invalid reaction type'),
  body('emoji').isString().notEmpty().withMessage('Emoji is required'),
  body('recipientId').isString().notEmpty().withMessage('Recipient ID is required'),
  body('shared').optional().isBoolean().withMessage('Shared must be a boolean'),
  body('sharingPlatforms').optional().isArray().withMessage('Sharing platforms must be an array'),
];

export const statusUpdateValidation = [
  param('id').isString().notEmpty().withMessage('Experience ID is required'),
  body('status')
    .isIn(['scheduled', 'delivered', 'viewed', 'reacted', 'shared', 'expired'])
    .withMessage('Invalid status'),
  body('timeSpentViewing').optional().isInt({ min: 0 }).withMessage('Time spent viewing must be a positive integer'),
];

export const experienceIdValidation = [
  param('id').isString().notEmpty().withMessage('Experience ID is required'),
];

export const recipientIdValidation = [
  param('id').isString().notEmpty().withMessage('Recipient ID is required'),
];

export const experienceQueryValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('recipientId').optional().isString().withMessage('Recipient ID must be a string'),
];