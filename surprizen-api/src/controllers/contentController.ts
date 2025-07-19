import { Request, Response, NextFunction } from 'express';
import { ContentGenerationService } from '../services/contentGenerationService';
import { ApiError } from '../middleware/errorHandler';
import { body, validationResult } from 'express-validator';

export class ContentController {
  private contentService = new ContentGenerationService();

  /**
   * Generate content based on parameters
   * POST /api/v1/content/generate
   */
  generateContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ApiError(400, 'Validation failed'));
      }

      const { type, persona, theme, intensity, recipientName } = req.body;

      const content = await this.contentService.generateContent(
        type,
        persona,
        theme,
        intensity,
        recipientName
      );

      res.json({
        success: true,
        data: content,
        message: 'Content generated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validate content for safety and appropriateness
   * POST /api/v1/content/validate
   */
  validateContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ApiError(400, 'Validation failed'));
      }

      const { content } = req.body;

      const validation = await this.contentService.validateContent(content);

      res.json({
        success: true,
        data: validation,
        message: 'Content validation completed',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate text content specifically
   * POST /api/v1/content/generate-text
   */
  generateTextContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ApiError(400, 'Validation failed'));
      }

      const { persona, theme, intensity, recipientName } = req.body;

      const content = await this.contentService.generateTextContent(
        persona,
        theme,
        intensity,
        recipientName
      );

      res.json({
        success: true,
        data: content,
        message: 'Text content generated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Select image content
   * POST /api/v1/content/select-image
   */
  selectImage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ApiError(400, 'Validation failed'));
      }

      const { theme, persona } = req.body;

      const content = await this.contentService.selectImage(theme, persona);

      res.json({
        success: true,
        data: content,
        message: 'Image selected successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate voucher content
   * POST /api/v1/content/generate-voucher
   */
  generateVoucher = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(new ApiError(400, 'Validation failed'));
      }

      const { persona, theme, recipientName } = req.body;

      const content = await this.contentService.generateVoucher(
        persona,
        theme,
        recipientName
      );

      res.json({
        success: true,
        data: content,
        message: 'Voucher generated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

// Validation middleware
export const generateContentValidation = [
  body('type')
    .isIn(['text', 'image', 'voucher'])
    .withMessage('Invalid content type'),
  body('persona')
    .isObject()
    .withMessage('Persona must be an object'),
  body('persona.interests')
    .isArray()
    .withMessage('Persona interests must be an array'),
  body('persona.personality')
    .isArray()
    .withMessage('Persona personality must be an array'),
  body('theme')
    .isString()
    .notEmpty()
    .withMessage('Theme is required'),
  body('intensity')
    .isIn(['subtle', 'moderate', 'immersive'])
    .withMessage('Invalid intensity level'),
  body('recipientName')
    .isString()
    .notEmpty()
    .withMessage('Recipient name is required'),
];

export const validateContentValidation = [
  body('content')
    .isObject()
    .withMessage('Content must be an object'),
  body('content.title')
    .isString()
    .notEmpty()
    .withMessage('Content title is required'),
  body('content.description')
    .isString()
    .notEmpty()
    .withMessage('Content description is required'),
];

export const generateTextValidation = [
  body('persona')
    .isObject()
    .withMessage('Persona must be an object'),
  body('theme')
    .isString()
    .notEmpty()
    .withMessage('Theme is required'),
  body('intensity')
    .isIn(['subtle', 'moderate', 'immersive'])
    .withMessage('Invalid intensity level'),
  body('recipientName')
    .isString()
    .notEmpty()
    .withMessage('Recipient name is required'),
];

export const selectImageValidation = [
  body('theme')
    .isString()
    .notEmpty()
    .withMessage('Theme is required'),
  body('persona')
    .isObject()
    .withMessage('Persona must be an object'),
];

export const generateVoucherValidation = [
  body('persona')
    .isObject()
    .withMessage('Persona must be an object'),
  body('theme')
    .isString()
    .notEmpty()
    .withMessage('Theme is required'),
  body('recipientName')
    .isString()
    .notEmpty()
    .withMessage('Recipient name is required'),
];