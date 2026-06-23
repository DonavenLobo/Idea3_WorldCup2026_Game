import type { CardProgressionLevel, CardProgressionMilestones } from "@gogaffa/types";

export function calculateCardProgressionLevel(
  milestones: CardProgressionMilestones
): CardProgressionLevel {
  if (milestones.hasCompletedFirstTrivia && milestones.hasFinalizedAllBracketGroups) {
    return 4;
  }

  if (milestones.hasCompletedFirstTrivia || milestones.hasFinalizedAllBracketGroups) {
    return 3;
  }

  return 2;
}

export function milestonesFromTimestamps(input: {
  firstTriviaCompletedAt: string | null;
  bracketGroupsFinalizedAt: string | null;
}): CardProgressionMilestones {
  return {
    hasCompletedFirstTrivia: input.firstTriviaCompletedAt !== null,
    hasFinalizedAllBracketGroups: input.bracketGroupsFinalizedAt !== null,
  };
}
