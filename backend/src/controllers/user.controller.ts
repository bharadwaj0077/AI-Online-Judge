import { Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

export class UserController {
  /**
   * Public Endpoint: Fetches the paginated global leaderboard list
   */
  static getLeaderboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const leaderboard = await UserService.getLeaderboard(page, limit);

      res.status(200).json({
        success: true,
        message: "Global matrix rankings compiled successfully.",
        data: leaderboard
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Protected Endpoint: Fetches detailed analytics metrics for the current session user
   */
  static getMyProfileStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const stats = await UserService.getUserProfileStats(userId);

      res.status(200).json({
        success: true,
        message: "User profile stats computed successfully.",
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };
}