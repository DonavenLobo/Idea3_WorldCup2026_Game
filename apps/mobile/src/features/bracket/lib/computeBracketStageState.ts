import { WORLD_CUP_FIXTURES } from "@gogaffa/config";
import type { MatchStage } from "@gogaffa/config";
import type { SubTab } from "../types";

const MATCH_COMPLETION_MS = 3 * 60 * 60 * 1000;

export type BracketPredictionStage =
  | "groups"
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "finals"
  | "complete";

type UnlockableStage = Exclude<BracketPredictionStage, "groups" | "complete">;

interface StageWindow {
  label: string;
  matchStages: readonly MatchStage[];
  subTabs: readonly SubTab[];
}

export interface BracketStageState {
  currentStage: BracketPredictionStage;
  currentStageLabel: string;
  firstEnabledSubTab: SubTab | null;
  nextStageUnlockAt: Date | null;
  nextStageLabel: string | null;
  isSubTabEnabled: (tab: SubTab) => boolean;
}

const STAGE_WINDOWS: Record<Exclude<BracketPredictionStage, "complete">, StageWindow> = {
  groups: {
    label: "Group Stage",
    matchStages: ["group"],
    subTabs: ["groups"],
  },
  r32: {
    label: "Round of 32",
    matchStages: ["r32"],
    subTabs: ["r32"],
  },
  r16: {
    label: "Round of 16",
    matchStages: ["r16"],
    subTabs: ["r16"],
  },
  qf: {
    label: "Quarter-finals",
    matchStages: ["qf"],
    subTabs: ["qf"],
  },
  sf: {
    label: "Semi-finals",
    matchStages: ["sf"],
    subTabs: ["sf"],
  },
  finals: {
    label: "Finals",
    matchStages: ["third", "final"],
    subTabs: ["final", "third"],
  },
};

const UNLOCK_ORDER: readonly UnlockableStage[] = ["r32", "r16", "qf", "sf", "finals"];

function latestCompletionForStages(stages: readonly MatchStage[]): Date | null {
  let latestMs = -Infinity;

  for (const fixture of WORLD_CUP_FIXTURES) {
    if (!stages.includes(fixture.stage)) continue;
    const kickoffMs = new Date(fixture.kickoffUtc).getTime();
    if (Number.isFinite(kickoffMs) && kickoffMs > latestMs) {
      latestMs = kickoffMs;
    }
  }

  return latestMs === -Infinity ? null : new Date(latestMs + MATCH_COMPLETION_MS);
}

const STAGE_UNLOCKS: Record<UnlockableStage, Date | null> = {
  r32: latestCompletionForStages(STAGE_WINDOWS.groups.matchStages),
  r16: latestCompletionForStages(STAGE_WINDOWS.r32.matchStages),
  qf: latestCompletionForStages(STAGE_WINDOWS.r16.matchStages),
  sf: latestCompletionForStages(STAGE_WINDOWS.qf.matchStages),
  finals: latestCompletionForStages(STAGE_WINDOWS.sf.matchStages),
};

const TOURNAMENT_COMPLETE_AT = latestCompletionForStages(STAGE_WINDOWS.finals.matchStages);

function stageForSubTab(tab: SubTab): BracketPredictionStage | "summary" {
  if (tab === "summary") return "summary";
  if (tab === "groups") return "groups";
  if (tab === "final" || tab === "third") return "finals";
  return tab;
}

function labelForStage(stage: BracketPredictionStage): string {
  if (stage === "complete") return "Tournament Complete";
  return STAGE_WINDOWS[stage].label;
}

function nextUnlockAfter(stage: BracketPredictionStage) {
  if (stage === "complete" || stage === "finals") {
    return { at: TOURNAMENT_COMPLETE_AT, label: "Tournament Complete" };
  }

  const next = UNLOCK_ORDER.find((candidate) => {
    const unlockAt = STAGE_UNLOCKS[candidate];
    return unlockAt && unlockAt.getTime() > (STAGE_UNLOCKS[stage as UnlockableStage]?.getTime() ?? -Infinity);
  });

  if (!next) {
    return { at: null, label: null };
  }

  return { at: STAGE_UNLOCKS[next], label: STAGE_WINDOWS[next].label };
}

export function computeBracketStageState(now: Date): BracketStageState {
  const nowMs = now.getTime();

  let currentStage: BracketPredictionStage = "groups";
  for (const stage of UNLOCK_ORDER) {
    const unlockAt = STAGE_UNLOCKS[stage];
    if (unlockAt && nowMs >= unlockAt.getTime()) {
      currentStage = stage;
    }
  }

  if (TOURNAMENT_COMPLETE_AT && nowMs >= TOURNAMENT_COMPLETE_AT.getTime()) {
    currentStage = "complete";
  }

  const enabledTabs =
    currentStage === "complete"
      ? []
      : STAGE_WINDOWS[currentStage].subTabs;

  const next = nextUnlockAfter(currentStage);

  return {
    currentStage,
    currentStageLabel: labelForStage(currentStage),
    firstEnabledSubTab: enabledTabs[0] ?? null,
    nextStageUnlockAt: next.at,
    nextStageLabel: next.label,
    isSubTabEnabled: (tab) => {
      if (tab === "summary") return true;
      return stageForSubTab(tab) === currentStage;
    },
  };
}
