import express from 'express';
import { 
  ContentController,
  generateContentValidation,
  validateContentValidation,
  generateTextValidation,
  selectImageValidation,
  generateVoucherValidation
} from '../controllers/contentController';
import { verifyToken } from '../middleware/authMiddleware';

const router = express.Router();
const contentController = new ContentController();

// All content generation routes require authentication
router.use(verifyToken);

// POST /api/v1/content/generate - Generate content based on parameters
router.post('/generate', generateContentValidation, contentController.generateContent);

// POST /api/v1/content/validate - Validate content for safety
router.post('/validate', validateContentValidation, contentController.validateContent);

// POST /api/v1/content/generate-text - Generate text content specifically
router.post('/generate-text', generateTextValidation, contentController.generateTextContent);

// POST /api/v1/content/select-image - Select image content
router.post('/select-image', selectImageValidation, contentController.selectImage);

// POST /api/v1/content/generate-voucher - Generate voucher content
router.post('/generate-voucher', generateVoucherValidation, contentController.generateVoucher);

export default router;