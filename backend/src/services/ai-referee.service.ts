import { GoogleGenAI } from "@google/genai";

const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in backend environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface PlayerMatchSummary {
  userId: string;
  username: string;
  code: string;
  language: string;
  passedCases: number;
  totalCases: number;
  verdict: string;
  executionTimeMs: number;
  antiCheatWarnings: number;
  submittedAtMs: number | null;
}

export interface PlayerScorecard {
  correctness: number; // 0 - 40
  efficiency: number;  // 0 - 25
  cleanliness: number; // 0 - 20
  speedAndConduct: number; // 0 - 15
  totalScore: number;  // 0 - 100
  timeComplexity: string;
  spaceComplexity: string;
}

export interface RefereeDecision {
  winnerId: string | "DRAW";
  winnerName: string;
  reason: string;
  scores: {
    player1: PlayerScorecard;
    player2: PlayerScorecard;
  };
  commentary: string;
}

export class AiRefereeService {
  /**
   * Evaluates a completed 1v1 battle match, computing multi-dimensional scores and declaring the winner.
   */
  static async evaluateBattle(
    problemTitle: string,
    problemStatement: string,
    player1: PlayerMatchSummary,
    player2: PlayerMatchSummary,
    mode: "classic" | "blitz" | "coop"
  ): Promise<RefereeDecision> {
    try {
      const ai = getGenAI();

      const prompt = `You are the Grandmaster AI Referee for competitive programming battles.
Two software engineers just finished a 1v1 duel on the algorithmic problem "${problemTitle}".
Evaluate both implementations side-by-side to declare the winner and score them on a 100-point rubric.

[PROBLEM STATEMENT]:
${problemStatement.slice(0, 1000)}

[PLAYER 1: ${player1.username}]:
- Language: ${player1.language}
- Test Cases Passed: ${player1.passedCases} / ${player1.totalCases} (${player1.verdict})
- Runtime: ${player1.executionTimeMs}ms
- Anti-Cheat Infractions: ${player1.antiCheatWarnings}
- Final Code:
\`\`\`
${player1.code || "# No code submitted"}
\`\`\`

[PLAYER 2: ${player2.username}]:
- Language: ${player2.language}
- Test Cases Passed: ${player2.passedCases} / ${player2.totalCases} (${player2.verdict})
- Runtime: ${player2.executionTimeMs}ms
- Anti-Cheat Infractions: ${player2.antiCheatWarnings}
- Final Code:
\`\`\`
${player2.code || "# No code submitted"}
\`\`\`

SCORING CRITERIA (Total 100 points each):
1. Correctness (0 to 40 pts): Weight test cases passed, edge case handling, and avoiding infinite loops.
2. Efficiency & Complexity (0 to 25 pts): Optimal asymptotic time & space complexity vs brute force.
3. Code Cleanliness (0 to 20 pts): Idiomatic structure, variable naming, readability, modularity.
4. Speed & Conduct (0 to 15 pts): Earlier valid submission bonus. Deduct 5 points per anti-cheat warning.

Respond STRICTLY with a valid JSON object matching this schema:
{
  "winner": "player1" | "player2" | "DRAW",
  "reason": "1-sentence summary of why the winner was chosen",
  "commentary": "2-3 paragraphs comparing both algorithmic strategies, space/time trade-offs, and edge cases.",
  "player1Scores": {
    "correctness": 35,
    "efficiency": 22,
    "cleanliness": 18,
    "speedAndConduct": 12,
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)"
  },
  "player2Scores": {
    "correctness": 28,
    "efficiency": 18,
    "cleanliness": 16,
    "speedAndConduct": 10,
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)"
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const raw = response.text?.trim() || "{}";
      const parsed = JSON.parse(raw);

      const p1Score: PlayerScorecard = {
        correctness: Number(parsed.player1Scores?.correctness ?? 25),
        efficiency: Number(parsed.player1Scores?.efficiency ?? 15),
        cleanliness: Number(parsed.player1Scores?.cleanliness ?? 15),
        speedAndConduct: Number(parsed.player1Scores?.speedAndConduct ?? 10),
        totalScore: 0,
        timeComplexity: parsed.player1Scores?.timeComplexity || "O(N)",
        spaceComplexity: parsed.player1Scores?.spaceComplexity || "O(1)"
      };
      p1Score.totalScore = p1Score.correctness + p1Score.efficiency + p1Score.cleanliness + p1Score.speedAndConduct;

      const p2Score: PlayerScorecard = {
        correctness: Number(parsed.player2Scores?.correctness ?? 25),
        efficiency: Number(parsed.player2Scores?.efficiency ?? 15),
        cleanliness: Number(parsed.player2Scores?.cleanliness ?? 15),
        speedAndConduct: Number(parsed.player2Scores?.speedAndConduct ?? 10),
        totalScore: 0,
        timeComplexity: parsed.player2Scores?.timeComplexity || "O(N)",
        spaceComplexity: parsed.player2Scores?.spaceComplexity || "O(1)"
      };
      p2Score.totalScore = p2Score.correctness + p2Score.efficiency + p2Score.cleanliness + p2Score.speedAndConduct;

      let winnerId: string | "DRAW" = "DRAW";
      let winnerName = "Draw (Equal Scores)";
      if (parsed.winner === "player1" || p1Score.totalScore > p2Score.totalScore) {
        winnerId = player1.userId;
        winnerName = player1.username;
      } else if (parsed.winner === "player2" || p2Score.totalScore > p1Score.totalScore) {
        winnerId = player2.userId;
        winnerName = player2.username;
      }

      return {
        winnerId,
        winnerName,
        reason: parsed.reason || `${winnerName} demonstrated superior correctness and algorithmic efficiency.`,
        scores: {
          player1: p1Score,
          player2: p2Score
        },
        commentary: parsed.commentary || "Both players demonstrated competitive problem-solving skills."
      };
    } catch (err: any) {
      console.warn("AI Referee fallback scoring used:", err.message);
      return this.computeDeterministicDecision(player1, player2);
    }
  }

  /**
   * Deterministic mathematical scoring fallback in case of API quota limits
   */
  private static computeDeterministicDecision(
    player1: PlayerMatchSummary,
    player2: PlayerMatchSummary
  ): RefereeDecision {
    const calcScore = (p: PlayerMatchSummary): PlayerScorecard => {
      const ratio = p.totalCases > 0 ? p.passedCases / p.totalCases : 0;
      const correctness = Math.round(ratio * 40);
      const isAccepted = p.verdict === "ACCEPTED";
      const efficiency = isAccepted ? 22 : Math.round(ratio * 18);
      const cleanliness = p.code.length > 20 && p.code.length < 1500 ? 17 : 12;
      const conductPenalty = Math.min(15, p.antiCheatWarnings * 5);
      const speedAndConduct = Math.max(0, 15 - conductPenalty);
      const totalScore = correctness + efficiency + cleanliness + speedAndConduct;

      return {
        correctness,
        efficiency,
        cleanliness,
        speedAndConduct,
        totalScore,
        timeComplexity: isAccepted ? "O(N)" : "O(N^2)",
        spaceComplexity: isAccepted ? "O(1)" : "O(N)"
      };
    };

    const s1 = calcScore(player1);
    const s2 = calcScore(player2);

    let winnerId: string | "DRAW" = "DRAW";
    let winnerName = "Draw (Tie Game)";
    let reason = "Both players scored identically across testcase accuracy and code analysis.";

    if (s1.totalScore > s2.totalScore) {
      winnerId = player1.userId;
      winnerName = player1.username;
      reason = `${player1.username} won by passing more test cases and maintaining an efficient algorithm.`;
    } else if (s2.totalScore > s1.totalScore) {
      winnerId = player2.userId;
      winnerName = player2.username;
      reason = `${player2.username} won with higher testcase pass rates and code cleanliness.`;
    }

    const commentary = `### Grandmaster AI Match Breakdown
**${player1.username}**:
- Scored **${s1.totalScore}/100** points (${s1.correctness}/40 on test cases, ${s1.efficiency}/25 efficiency, ${s1.cleanliness}/20 cleanliness).
- Final implementation verdict: \`${player1.verdict}\`.

**${player2.username}**:
- Scored **${s2.totalScore}/100** points (${s2.correctness}/40 on test cases, ${s2.efficiency}/25 efficiency, ${s2.cleanliness}/20 cleanliness).
- Final implementation verdict: \`${player2.verdict}\`.

${winnerId !== "DRAW" ? `**Decision Verdict**: Congratulations to **${winnerName}** for taking the match victory with optimal problem structure and disciplined conduct.` : "**Decision Verdict**: Both developers achieved equal performance, resulting in a technical draw."}`;

    return {
      winnerId,
      winnerName,
      reason,
      scores: {
        player1: s1,
        player2: s2
      },
      commentary
    };
  }
}
