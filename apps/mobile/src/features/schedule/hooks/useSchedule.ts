import { useMemo } from "react";
import { WORLD_CUP_FIXTURES } from "@world-cup-game/config";
import { useProfile } from "../../profile/hooks/useProfile";
import type { ScheduleFilter, ScheduleSection } from "../types";
import { useCachedMatchScores } from "./useCachedMatchScores";
import {
  deviceTimeZone,
  filterMatches,
  groupByLocalDay,
  matchesMyTeam,
  myTeamNamesForCode
} from "../utils";

interface UseScheduleResult {
  isLoadingScores: boolean;
  refreshScores: () => Promise<void>;
  sections: ScheduleSection[];
  showMyTeam: boolean;
  timeZone: string;
}

export function useSchedule(filter: ScheduleFilter): UseScheduleResult {
  const { profile } = useProfile();
  const { isLoading: isLoadingScores, refresh: refreshScores, scoresByMatchNum } =
    useCachedMatchScores();
  const timeZone = deviceTimeZone();

  const myTeamNames = useMemo(
    () => myTeamNamesForCode(profile?.selectedNationCode),
    [profile?.selectedNationCode]
  );

  const showMyTeam = useMemo(
    () => WORLD_CUP_FIXTURES.some((fixture) => matchesMyTeam(fixture, myTeamNames)),
    [myTeamNames]
  );

  const fixturesWithScores = useMemo(
    () =>
      WORLD_CUP_FIXTURES.map((fixture) => {
        const score = scoresByMatchNum.get(fixture.num) ?? null;
        return {
          ...fixture,
          score,
          status: score?.status ?? "scheduled"
        };
      }),
    [scoresByMatchNum]
  );

  const sections = useMemo(
    () => groupByLocalDay(filterMatches(fixturesWithScores, filter, myTeamNames), timeZone),
    [filter, fixturesWithScores, myTeamNames, timeZone]
  );

  return { isLoadingScores, refreshScores, sections, showMyTeam, timeZone };
}
