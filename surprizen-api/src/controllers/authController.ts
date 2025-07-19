import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { User } from '../models/User';
import { AuthService } from '../services/authService';
import { ApiError } from '../middleware/errorHandler';

const userModel = new User();
const authService = new AuthService();

/**
 * Create session from Firebase ID token
 */
export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Request body:', req.body);
    
    const { idToken } = req.body;
    
    if (!idToken) {
      throw new ApiError(400, 'Firebase ID token is required');
    }
    
    console.log('Attempting to verify Firebase token...');
    
    try {
      // First verify the token
      const decodedToken = await authService.verifyFirebaseToken(idToken);
      
      console.log('Token verified successfully. User:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name
      });
      
      // Generate session tokens
      const sessionTokens = await authService.createSessionFromFirebaseToken(idToken);
      
      // Try to create or update user profile, but don't block on errors
      try {
        await userModel.createOrUpdateProfile(decodedToken.uid, {
          email: decodedToken.email || '',
          displayName: decodedToken.name || '',
          photoURL: decodedToken.picture || '',
        });
      } catch (profileError) {
        // Log the error but continue with session creation
        console.error('Error creating/updating user profile:', profileError);
        console.log('Continuing with session creation despite profile error');
      }
      
      // Return the session tokens
      res.status(200).json({
        success: true,
        data: sessionTokens,
      });
    } catch (verifyError) {
      console.error('Firebase token verification failed:', verifyError);
      const errorMessage = verifyError instanceof Error ? verifyError.message : 'Token verification failed';
      throw new ApiError(401, `Invalid or expired Firebase token: ${errorMessage}`);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('Refresh token request body:', req.body);
    
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token is required');
    }
    
    console.log('Refresh token found in request, length:', refreshToken.length);
    
    const newTokens = authService.refreshAccessToken(refreshToken);
    
    res.status(200).json({
      success: true,
      data: newTokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }

    try {
      const userProfile = await userModel.getProfileById(req.user.uid);
      
      if (userProfile) {
        return res.status(200).json({
          success: true,
          data: userProfile,
        });
      }
    } catch (error) {
      console.log('Error fetching user profile from Firestore, using basic profile:', error);
      // Continue with basic profile
    }
    
    // If Firestore fails or profile not found, return basic profile from token
    const basicProfile = {
      id: req.user.uid,
      email: req.user.email,
      displayName: '',
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    res.status(200).json({
      success: true,
      data: basicProfile,
      note: 'Basic profile returned. Firestore database not available.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update user profile
 */
export const createOrUpdateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }
    
    const { displayName, photoURL, preferences } = req.body;
    
    const userProfile = await userModel.createOrUpdateProfile(req.user.uid, {
      email: req.user.email,
      displayName,
      photoURL,
      preferences,
    });
    
    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user preferences
 */
export const updatePreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }
    
    const { preferences } = req.body;
    
    if (!preferences) {
      throw new ApiError(400, 'Preferences are required');
    }
    
    const userProfile = await userModel.updatePreferences(req.user.uid, preferences);
    
    if (!userProfile) {
      throw new ApiError(404, 'User profile not found');
    }
    
    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account and profile
 */
export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }
    
    // Delete user profile from Firestore
    await userModel.deleteProfile(req.user.uid);
    
    // Delete user from Firebase Auth
    await auth.deleteUser(req.user.uid);
    
    res.status(200).json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user experience credits
 */
export const updateExperienceCredits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }
    
    const { credits, operation = 'set' } = req.body;
    
    if (typeof credits !== 'number' || credits < 0) {
      throw new ApiError(400, 'Credits must be a non-negative number');
    }
    
    if (!['set', 'add', 'deduct'].includes(operation)) {
      throw new ApiError(400, 'Operation must be one of: set, add, deduct');
    }
    
    const userProfile = await userModel.updateExperienceCredits(req.user.uid, credits, operation);
    
    if (!userProfile) {
      throw new ApiError(404, 'User profile not found');
    }
    
    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user experience credits
 */
export const getExperienceCredits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }
    
    const userProfile = await userModel.getProfileById(req.user.uid);
    
    if (!userProfile) {
      throw new ApiError(404, 'User profile not found');
    }
    
    res.status(200).json({
      success: true,
      data: {
        credits: userProfile.experienceCredits || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has sufficient credits
 */
export const checkCredits = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }
    
    const requiredCredits = parseInt(req.query.required as string) || 1;
    
    if (requiredCredits < 0) {
      throw new ApiError(400, 'Required credits must be non-negative');
    }
    
    const hasCredits = await userModel.hasCredits(req.user.uid, requiredCredits);
    
    res.status(200).json({
      success: true,
      data: {
        hasCredits,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user subscription
 */
export const updateSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }
    
    const subscriptionData = req.body;
    
    if (!subscriptionData || Object.keys(subscriptionData).length === 0) {
      throw new ApiError(400, 'Subscription data is required');
    }
    
    const userProfile = await userModel.updateSubscription(req.user.uid, subscriptionData);
    
    if (!userProfile) {
      throw new ApiError(404, 'User profile not found');
    }
    
    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user subscription status
 */
export const getSubscriptionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }
    
    const subscriptionStatus = await userModel.getSubscriptionStatus(req.user.uid);
    
    if (!subscriptionStatus) {
      throw new ApiError(404, 'User profile not found');
    }
    
    res.status(200).json({
      success: true,
      data: subscriptionStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update specific preference categories
 */
export const updateSpecificPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Authentication required');
    }
    
    const { preferenceType } = req.params;
    const preferences = req.body;
    
    if (!['notification', 'ui', 'experience', 'privacy'].includes(preferenceType)) {
      throw new ApiError(400, 'Invalid preference type. Must be one of: notification, ui, experience, privacy');
    }
    
    if (!preferences || Object.keys(preferences).length === 0) {
      throw new ApiError(400, 'Preference data is required');
    }
    
    const userProfile = await userModel.updateSpecificPreferences(
      req.user.uid,
      preferenceType as 'notification' | 'ui' | 'experience' | 'privacy',
      preferences
    );
    
    if (!userProfile) {
      throw new ApiError(404, 'User profile not found');
    }
    
    res.status(200).json({
      success: true,
      data: userProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify session token
 */
export const verifySession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Unauthorized - Invalid or expired session');
    }
    
    res.status(200).json({
      success: true,
      message: 'Session is valid',
      user: {
        uid: req.user.uid,
        email: req.user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};