import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/errorHandler';

export class JourneyController {
  /**
   * Get user journey statistics
   */
  async getJourneyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.uid;
      
      // Mock data for beta version
      const stats = {
        totalJourneys: 3,
        completedJourneys: 1,
        inProgressJourneys: 2,
        totalGiftsGiven: 5,
        averageRating: 4.8,
        favoriteCategories: ['Tech', 'Books', 'Experiences'],
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's journeys
   */
  async getJourneys(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.uid;
      
      // Mock data for beta version
      const journeys = [
        {
          id: 'journey_1',
          title: 'Birthday Gift for Sarah',
          recipient: 'Sarah Johnson',
          occasion: 'Birthday',
          status: 'completed',
          createdAt: new Date('2024-12-01').toISOString(),
          completedAt: new Date('2024-12-15').toISOString(),
          giftIdeas: 3,
          finalChoice: 'Vintage Camera',
        },
        {
          id: 'journey_2',
          title: 'Anniversary Gift for Parents',
          recipient: 'Mom & Dad',
          occasion: 'Anniversary',
          status: 'in_progress',
          createdAt: new Date('2024-12-10').toISOString(),
          giftIdeas: 5,
        },
        {
          id: 'journey_3',
          title: 'Christmas Gift for Brother',
          recipient: 'Mike',
          occasion: 'Christmas',
          status: 'planning',
          createdAt: new Date('2024-12-20').toISOString(),
          giftIdeas: 0,
        },
      ];

      res.json({
        success: true,
        data: journeys,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new journey
   */
  async createJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.uid;
      const { title, recipient, occasion, budget, preferences } = req.body;

      if (!title || !recipient || !occasion) {
        throw new ApiError(400, 'Title, recipient, and occasion are required');
      }

      // Mock creation for beta version
      const newJourney = {
        id: `journey_${Date.now()}`,
        title,
        recipient,
        occasion,
        budget: budget || null,
        preferences: preferences || {},
        status: 'planning',
        createdAt: new Date().toISOString(),
        giftIdeas: 0,
        userId,
      };

      res.status(201).json({
        success: true,
        data: newJourney,
        message: 'Journey created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get journey by ID
   */
  async getJourneyById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.uid;
      const { id } = req.params;

      // Mock data for beta version
      const journey = {
        id,
        title: 'Birthday Gift for Sarah',
        recipient: 'Sarah Johnson',
        occasion: 'Birthday',
        budget: 100,
        preferences: {
          interests: ['photography', 'travel', 'coffee'],
          style: 'vintage',
          relationship: 'close_friend',
        },
        status: 'in_progress',
        createdAt: new Date('2024-12-01').toISOString(),
        giftIdeas: [
          {
            id: 'idea_1',
            name: 'Vintage Camera',
            description: 'A beautiful film camera perfect for photography enthusiasts',
            price: 85,
            reasoning: 'Matches her love for photography and vintage aesthetic',
            rating: 9.2,
          },
          {
            id: 'idea_2',
            name: 'Coffee Subscription',
            description: '3-month specialty coffee subscription',
            price: 75,
            reasoning: 'Great for her daily coffee ritual and trying new flavors',
            rating: 8.7,
          },
          {
            id: 'idea_3',
            name: 'Travel Journal',
            description: 'Leather-bound travel journal with maps',
            price: 45,
            reasoning: 'Perfect for documenting her travel adventures',
            rating: 8.1,
          },
        ],
        userId,
      };

      res.json({
        success: true,
        data: journey,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update journey
   */
  async updateJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.uid;
      const { id } = req.params;
      const updates = req.body;

      // Mock update for beta version
      const updatedJourney = {
        id,
        ...updates,
        updatedAt: new Date().toISOString(),
        userId,
      };

      res.json({
        success: true,
        data: updatedJourney,
        message: 'Journey updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete journey
   */
  async deleteJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.uid;
      const { id } = req.params;

      // Mock deletion for beta version
      res.json({
        success: true,
        message: 'Journey deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}