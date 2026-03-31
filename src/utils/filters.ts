// Barrier matching logic - prioritize people who have the least
export function calculateBarrierMatch(
  userBarriers: string[],
  resourceAccommodates: string[]
): { score: number; matches: string[]; missing: string[] } {
  const matches = userBarriers.filter((barrier) =>
    resourceAccommodates.includes(barrier)
  );
  
  const missing = userBarriers.filter((barrier) =>
    !resourceAccommodates.includes(barrier)
  );
  
  // Priority: resources that handle MORE barriers rank higher
  const score = matches.length;
  
  return { score, matches, missing };
}

export function rankByBarrierMatches<T extends { accommodates: string[] }>(
  items: T[],
  userBarriers: string[]
): Array<T & { matchScore: number; matchCount: number }> {
  return items
    .map((item) => ({
      ...item,
      matchScore: calculateBarrierMatch(userBarriers, item.accommodates).score,
      matchCount: item.accommodates.length,
    }))
    .sort((a, b) => {
      // Higher match score = higher priority (handles more of user's barriers)
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      // Tiebreaker: more total accommodations is better
      return b.matchCount - a.matchCount;
    });
}
