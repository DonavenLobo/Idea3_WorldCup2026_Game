import { supabase } from "../../../lib/supabase";

export interface MilestoneHit {
  atStreak: number;
  bonus: number;
}

export interface ClaimDailyLoginResponse {
  alreadyClaimedToday: boolean;
  awarded: number;
  newStreak: number;
  newLongestStreak: number;
  milestoneHit: MilestoneHit | null;
  newLastLoginDateKey: string;
}

/**
 * Raw response from the `claim-daily-login` edge function.
 *
 * The edge function returns two distinct shapes:
 *   - `shouldClaim === true`  → { alreadyClaimedToday: false, awarded, newStreak, newLongestStreak, milestoneHit, newLastLoginDateKey }
 *   - `shouldClaim === false` → { alreadyClaimedToday: true,  currentStreak, newLongestStreak, newLastLoginDateKey, milestoneHit }
 *
 * We normalize both into `ClaimDailyLoginResponse` so consumers always see the
 * same fields.
 */
interface ClaimedTodayResponse {
  alreadyClaimedToday: false;
  awarded: number;
  newStreak: number;
  newLongestStreak: number;
  milestoneHit: MilestoneHit | null;
  newLastLoginDateKey: string;
}

interface AlreadyClaimedResponse {
  alreadyClaimedToday: true;
  currentStreak: number;
  newLongestStreak: number;
  newLastLoginDateKey: string;
  milestoneHit: MilestoneHit | null;
}

type RawClaimDailyLoginResponse = ClaimedTodayResponse | AlreadyClaimedResponse;

function normalizeClaimResponse(raw: RawClaimDailyLoginResponse): ClaimDailyLoginResponse {
  if (raw.alreadyClaimedToday) {
    return {
      alreadyClaimedToday: true,
      awarded: 0,
      newStreak: raw.currentStreak,
      newLongestStreak: raw.newLongestStreak,
      milestoneHit: raw.milestoneHit,
      newLastLoginDateKey: raw.newLastLoginDateKey
    };
  }

  return {
    alreadyClaimedToday: false,
    awarded: raw.awarded,
    newStreak: raw.newStreak,
    newLongestStreak: raw.newLongestStreak,
    milestoneHit: raw.milestoneHit,
    newLastLoginDateKey: raw.newLastLoginDateKey
  };
}

export async function claimDailyLogin(today: string): Promise<ClaimDailyLoginResponse> {
  const { data, error } = await supabase.functions.invoke<RawClaimDailyLoginResponse>(
    "claim-daily-login",
    { body: { today } }
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("claim-daily-login returned no data");
  }

  return normalizeClaimResponse(data);
}
