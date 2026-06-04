import { useMemo } from "react";
import { WORLD_CUP_FIXTURES } from "@world-cup-game/config";
import { useProfile } from "../../../hooks/useProfile";
import type { ScheduleFilter, ScheduleSection } from "../types";
import {
  deviceTimeZone,
  filterMatches,
  groupByLocalDay,
  matchesMyTeam,
  myTeamNamesForCode
} from "../utils";

interface UseScheduleResult {
  sections: ScheduleSection[];
  showMyTeam: boolean;
  timeZone: string;
}

export function useSchedule(filter: ScheduleFilter): UseScheduleResult {
  // Phase 1 is static: fixtures come straight from @world-cup-game/config.
  // TODO(Phase 2): fetch the live results overlay here (see deferred Task 8)
  // and merge resolved teams / scores before grouping.
  const { profile } = useProfile();
  const timeZone = deviceTimeZone();

  const myTeamNames = useMemo(
    () => myTeamNamesForCode(profile?.selectedNationCode),
    [profile?.selectedNationCode]
  );

  const showMyTeam = useMemo(
    () => WORLD_CUP_FIXTURES.some((fixture) => matchesMyTeam(fixture, myTeamNames)),
    [myTeamNames]
  );

  const sections = useMemo(
    () => groupByLocalDay(filterMatches(WORLD_CUP_FIXTURES, filter, myTeamNames), timeZone),
    [filter, myTeamNames, timeZone]
  );

  return { sections, showMyTeam, timeZone };
}
