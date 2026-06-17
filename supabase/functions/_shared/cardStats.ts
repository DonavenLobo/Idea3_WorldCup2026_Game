import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const TRIVIA_CATCH_UP_AMOUNT = 2;     // mirror of @world-cup-game/config TRIVIA_CATCH_UP_AMOUNT
export const CARD_STAT_KEYS = ["atk","ast","frm","hyp","lck","wal"] as const;
export type CardStatKey = typeof CARD_STAT_KEYS[number];

export interface ApplyCardStatBumpsInput {
  /** Explicit per-stat bumps (additive, clamped). */
  bumps?: Partial<Record<CardStatKey, number>>;
  /** Number of "catch-up" iterations (each +catchUpAmount to currently-lowest stat). */
  catchUpCount?: number;
  catchUpAmount?: number;
}

/**
 * Failure-tolerant wrapper around the apply_card_stat_bumps SQL RPC.
 * Logs and swallows errors — scoring/login/bracket flows are authoritative
 * even if stat bumps fail.
 */
export async function safeApplyCardStatBumps(
  supabase: SupabaseClient,
  userId: string,
  input: ApplyCardStatBumpsInput
): Promise<void> {
  try {
    const { error } = await supabase.rpc("apply_card_stat_bumps", {
      p_user_id: userId,
      p_bumps: input.bumps ?? {},
      p_catch_up_count: input.catchUpCount ?? 0,
      p_catch_up_amount: input.catchUpAmount ?? TRIVIA_CATCH_UP_AMOUNT,
    });
    if (error) {
      console.error("apply_card_stat_bumps failed", error);
    }
  } catch (e) {
    console.error("apply_card_stat_bumps threw", e);
  }
}

export { TRIVIA_CATCH_UP_AMOUNT };
