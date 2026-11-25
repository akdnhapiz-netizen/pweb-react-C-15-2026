export interface SkillMatchResult {
  percentage: number;
  matchedCount: number;
  totalRequired: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export function calculateSkillMatch(
  requiredSkills: string[],
  kaptenSkills: string[]
): SkillMatchResult {
  if (requiredSkills.length === 0) {
    return {
      percentage: 0,
      matchedCount: 0,
      totalRequired: 0,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const normalizedKapten = new Set(
    kaptenSkills.map((skill) => skill.trim().toLowerCase())
  );

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const req of requiredSkills) {
    if (normalizedKapten.has(req.trim().toLowerCase())) {
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  }

  const percentage = Math.round(
    (matchedSkills.length / requiredSkills.length) * 100
  );

  return {
    percentage,
    matchedCount: matchedSkills.length,
    totalRequired: requiredSkills.length,
    matchedSkills,
    missingSkills,
  };
}

export type MatchLevel = "high" | "medium" | "low";

/** hijau >= 70, kuning 40–69, merah < 40 */
export function getMatchLevel(percentage: number): MatchLevel {
  if (percentage >= 70) return "high";
  if (percentage >= 40) return "medium";
  return "low";
}
