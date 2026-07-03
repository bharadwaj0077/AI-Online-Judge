import { prisma } from "../config/db";

export class UserService {
  /**
   * Compiles the global platform leaderboard using point weights and acceptance rates
   */
  static async getLeaderboard(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    // 1. Fetch users along with their historical submission records
    const users = await prisma.user.findMany({
      include: {
        submissions: {
          include: { problem: true }
        }
      }
    });

    // 2. Map and compute real-time ranking matrices for each profile
    const leaderboardProfile = users.map((user) => {
      const allSubmissions = user.submissions;
      const totalSubmissionsCount = allSubmissions.length;

      // Filter down to unique problems successfully solved (ACCEPTED)
      const acceptedSubmissions = allSubmissions.filter(sub => sub.verdict === "ACCEPTED");
      
      const uniqueProblemsMap = new Map<string, string>(); // problemId -> difficulty
      acceptedSubmissions.forEach((sub) => {
        uniqueProblemsMap.set(sub.problemId.toString(), sub.problem.difficulty);
      });

      // Calculate Weighted Point Score
      let totalPoints = 0;
      uniqueProblemsMap.forEach((difficulty) => {
        if (difficulty === "EASY") totalPoints += 10;
        else if (difficulty === "MEDIUM") totalPoints += 30;
        else if (difficulty === "HARD") totalPoints += 50;
      });

      // Calculate Acceptance Accuracy Percentage
      const acceptanceRate = totalSubmissionsCount > 0 
        ? parseFloat(((acceptedSubmissions.length / totalSubmissionsCount) * 100).toFixed(2))
        : 0.00;

      return {
        userId: user.id.toString(),
        username: user.username,
        totalPoints,
        uniqueSolvedCount: uniqueProblemsMap.size,
        totalSubmissionsCount,
        acceptanceRate
      };
    });

    // 3. Apply the LeetCode sorting matrix
    leaderboardProfile.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.uniqueSolvedCount !== a.uniqueSolvedCount) return b.uniqueSolvedCount - a.uniqueSolvedCount;
      return b.acceptanceRate - a.acceptanceRate;
    });

    // 4. Slice data chunks for pagination support at scale
    const paginatedData = leaderboardProfile.slice(skip, skip + limit);

    return {
      profiles: paginatedData,
      totalProfilesCount: leaderboardProfile.length,
      page,
      totalPagesCount: Math.ceil(leaderboardProfile.length / limit)
    };
  }

  /**
   * Compiles deep profile analytics data blocks for an individual user
   */
  static async getUserProfileStats(userId: string) {
    const submissions = await prisma.submission.findMany({
      where: { userId: BigInt(userId) },
      include: { problem: true }
    });

    const totalSubmissions = submissions.length;
    const acceptedSubmissions = submissions.filter(s => s.verdict === "ACCEPTED");

    // Track unique solved problem IDs by difficulty tier strings
    const solvedEasy = new Set<string>();
    const solvedMedium = new Set<string>();
    const solvedHard = new Set<string>();

    acceptedSubmissions.forEach((sub) => {
      const pId = sub.problemId.toString();
      if (sub.problem.difficulty === "EASY") solvedEasy.add(pId);
      else if (sub.problem.difficulty === "MEDIUM") solvedMedium.add(pId);
      else if (sub.problem.difficulty === "HARD") solvedHard.add(pId);
    });

    const acceptanceRate = totalSubmissions > 0
      ? parseFloat(((acceptedSubmissions.length / totalSubmissions) * 100).toFixed(2))
      : 0.00;

    return {
      totalSubmissions,
      acceptanceRate,
      solvedBreakdown: {
        totalSolved: solvedEasy.size + solvedMedium.size + solvedHard.size,
        easy: solvedEasy.size,
        medium: solvedMedium.size,
        hard: solvedHard.size
      }
    };
  }
}