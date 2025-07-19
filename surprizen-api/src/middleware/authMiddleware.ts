import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { ApiError } from './errorHandler';

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        role?: string;
      };
    }
  }
}

/**
 * Middleware to verify JWT token (not Firebase token)
 */
export const verifyToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    console.log('Headers:', req.headers);
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No Bearer token found in Authorization header');
      throw new ApiError(401, 'Unauthorized - No token provided');
    }
    
    console.log('Authorization header found:', authHeader.substring(0, 20) + '...');
    const token = authHeader.split(' ')[1];
    
    try {
      // Import the AuthService to verify JWT tokens
      const { AuthService } = require('../services/authService');
      const authService = new AuthService();
      
      console.log('Verifying JWT token...');
      const decodedToken = authService.verifyToken(token);
      console.log('Token verified successfully:', decodedToken);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: decodedToken.role,
      };
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new ApiError(401, 'Unauthorized - Invalid token');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware - doesn't require authentication but will
 * attach user data to request if token is valid
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Import the AuthService to verify JWT tokens
      const { AuthService } = require('../services/authService');
      const authService = new AuthService();
      
      // Verify JWT token (not Firebase token)
      const decodedToken = authService.verifyToken(token);
      
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        role: decodedToken.role,
      };
    } catch (error) {
      // Ignore token validation errors in optional auth
      console.warn('Invalid token in optional auth:', error);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new ApiError(401, 'Unauthorized - Authentication required'));
  }
  
  if (req.user.role !== 'admin') {
    return next(new ApiError(403, 'Forbidden - Admin access required'));
  }
  
  next();
};