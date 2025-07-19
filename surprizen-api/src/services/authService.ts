import jwt, { SignOptions } from 'jsonwebtoken';
import { auth } from '../config/firebase';
import { ApiError } from '../middleware/errorHandler';

interface TokenPayload {
    uid: string;
    email: string;
    role?: string;
}

export class AuthService {
    private readonly jwtSecret: string;
    private readonly tokenExpiration: string | number;
    private readonly refreshTokenExpiration: string | number;

    constructor() {
        // Get JWT secret from environment variables or use a default for development
        this.jwtSecret = process.env.JWT_SECRET || 'surprizen-dev-secret';

        // Token expiration times - these are valid string formats for jsonwebtoken
        this.tokenExpiration = process.env.JWT_EXPIRATION || '1h';
        this.refreshTokenExpiration = process.env.JWT_REFRESH_EXPIRATION || '30d';

        // Validate JWT secret in production
        if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'surprizen-dev-secret')) {
            console.warn('WARNING: Using default JWT secret in production environment. This is insecure!');
        }
    }

    /**
     * Generate JWT access token
     * @param payload Token payload
     * @returns JWT access token
     */
    generateAccessToken(payload: TokenPayload): string {
        // Using as any to bypass TypeScript's type checking for expiresIn
        // This is safe because the string formats like '1h', '30d' are valid for jsonwebtoken
        const options = {
            expiresIn: this.tokenExpiration,
        } as SignOptions;
        return jwt.sign(payload, this.jwtSecret, options);
    }

    /**
     * Generate JWT refresh token
     * @param payload Token payload
     * @returns JWT refresh token
     */
    generateRefreshToken(payload: TokenPayload): string {
        // Using as any to bypass TypeScript's type checking for expiresIn
        // This is safe because the string formats like '1h', '30d' are valid for jsonwebtoken
        const options = {
            expiresIn: this.refreshTokenExpiration,
        } as SignOptions;
        return jwt.sign(payload, this.jwtSecret, options);
    }

    /**
     * Verify JWT token
     * @param token JWT token
     * @returns Token payload
     */
    verifyToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, this.jwtSecret) as TokenPayload;
        } catch (error) {
            throw new ApiError(401, 'Invalid or expired token');
        }
    }

    /**
     * Verify Firebase ID token
     * @param idToken Firebase ID token
     * @returns Firebase user data
     */
    async verifyFirebaseToken(idToken: string) {
        try {
            return await auth.verifyIdToken(idToken);
        } catch (error) {
            throw new ApiError(401, 'Invalid or expired Firebase token');
        }
    }

    /**
     * Generate session tokens from Firebase ID token
     * @param idToken Firebase ID token
     * @returns Access and refresh tokens
     */
    async createSessionFromFirebaseToken(idToken: string) {
        const decodedToken = await this.verifyFirebaseToken(idToken);

        const payload: TokenPayload = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            role: decodedToken.role,
        };

        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload),
            expiresIn: this.getExpirationTime(this.tokenExpiration),
        };
    }

    /**
     * Refresh access token using refresh token
     * @param refreshToken JWT refresh token
     * @returns New access token
     */
    refreshAccessToken(refreshToken: string) {
        try {
            console.log('Attempting to refresh token with:', refreshToken.substring(0, 20) + '...');
            
            try {
                // Verify the refresh token
                const payload = this.verifyToken(refreshToken);
                console.log('Token verified successfully, payload:', payload);
                
                // Create a new payload without the exp property
                const newPayload = {
                    uid: payload.uid,
                    email: payload.email,
                    role: payload.role
                };
                
                // Generate a new access token with the clean payload
                const accessToken = this.generateAccessToken(newPayload);
                
                return {
                    accessToken,
                    expiresIn: this.getExpirationTime(this.tokenExpiration),
                };
            } catch (verifyError) {
                console.error('Token verification failed:', verifyError);
                const errorMessage = verifyError instanceof Error ? verifyError.message : 'Token verification failed';
                throw new ApiError(401, `Invalid or expired refresh token: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error in refreshAccessToken:', error);
            throw error;
        }
    }

    /**
     * Calculate token expiration time in seconds
     * @param expiration Expiration string or number (e.g., '1h', '30d', 3600)
     * @returns Expiration time in seconds
     */
    private getExpirationTime(expiration: string | number): number {
        // If expiration is already a number, return it directly
        if (typeof expiration === 'number') {
            return expiration;
        }
        
        const unit = expiration.slice(-1);
        const value = parseInt(expiration.slice(0, -1), 10);

        switch (unit) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 60 * 60;
            case 'd':
                return value * 24 * 60 * 60;
            default:
                return 3600; // Default to 1 hour
        }
    }
}