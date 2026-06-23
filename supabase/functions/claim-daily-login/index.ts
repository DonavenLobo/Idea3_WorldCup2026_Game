import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { parseClaimDailyLoginRequest } from "./schema.ts";
import {
  computeLoginReward,
  type ComputeLoginRewardMilestone,
} from "./computeLoginReward.ts";
import { safeApplyCardStatBumps } from "../_shared/cardStats.ts";

// MIRROR of packages/config/src/xpRules.ts LOGIN stat-bump constants.
// Edge functions run in Deno and cannot import workspace packages.
// Keep in sync manually when login stat-earning rules change.
const LOGIN_DAILY_BUMP = { hyp: 1 } as const;
const LOGIN_STREAK_MILESTONE_BUMPS: Record<number, Record<string, number>> = {
  7: { hyp: 3 },
  14: { frm: 3 },
  // Day-30 "user's choice" UI deferred to v2; v1 default = Hype.
  30: { hyp: 3 },
};

function buildLoginStatBumps(newStreak: number): Record<string, number> {
  const bumps: Record<string, number> = { ...LOGIN_DAILY_BUMP };
  const milestone = LOGIN_STREAK_MILESTONE_BUMPS[newStreak];
  if (milestone) {
    for (const [k, v] of Object.entries(milestone)) {
      bumps[k] = (bumps[k] ?? 0) + v;
    }
  }
  return bumps;
}

type SupabaseClient = ReturnType<typeof createClient<any>>;

interface ProfileLoginRow {
  current_login_streak: number;
  longest_login_streak: number;
  last_login_date: string | null;
}

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}

async function loadProfileLogin(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<ProfileLoginRow> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("current_login_streak, longest_login_streak, last_login_date")
    .eq("id", userId)
    .maybeSingle<ProfileLoginRow>();

  if (error) {
    throw error;
  }

  return {
    current_login_streak: data?.current_login_streak ?? 0,
    longest_login_streak: data?.longest_login_streak ?? 0,
    last_login_date: data?.last_login_date ?? null,
  };
}

interface AlreadyClaimedResponseBody {
  alreadyClaimedToday: true;
  currentStreak: number;
  newLongestStreak: number;
  newLastLoginDateKey: string;
  milestoneHit: ComputeLoginRewardMilestone | null;
}

function alreadyClaimedResponse(
  currentStreak: number,
  longestStreak: number,
  today: string
): AlreadyClaimedResponseBody {
  return {
    alreadyClaimedToday: true,
    currentStreak,
    newLongestStreak: longestStreak,
    newLastLoginDateKey: today,
    milestoneHit: null,
  };
}

// Postgres unique-violation code (login_events_user_day_uniq).
const PG_UNIQUE_VIOLATION = "23505";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const input = parseClaimDailyLoginRequest(await request.json());
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authorization = request.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse({ error: "Supabase environment is not configured." }, 500);
    }

    if (!authorization) {
      return jsonResponse({ error: "Missing Authorization header." }, 401);
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const { data: userData, error: userError } = await supabaseUser.auth.getUser();

    if (userError || !userData.user) {
      return jsonResponse({ error: "Unauthorized." }, 401);
    }

    const userId = userData.user.id;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const profile = await loadProfileLogin(supabaseAdmin, userId);

    const result = computeLoginReward({
      today: input.today,
      lastLoginDateKey: profile.last_login_date,
      currentStreak: profile.current_login_streak,
      longestStreak: profile.longest_login_streak,
    });

    // Same-day re-call → no-op.
    if (!result.shouldClaim) {
      return jsonResponse(
        alreadyClaimedResponse(
          profile.current_login_streak,
          profile.longest_login_streak,
          input.today
        )
      );
    }

    // Persist the login_events row first. If a concurrent claim already wrote
    // a row for (user_id, today), the unique index throws 23505 and we surface
    // a graceful "already claimed" response — same as the same-day re-call path.
    const milestoneBonus = result.milestoneHit ? result.milestoneHit.bonus : 0;
    const { error: loginInsertError } = await supabaseAdmin
      .from("login_events")
      .insert({
        user_id: userId,
        login_date: input.today,
        points_awarded: result.awarded,
        milestone_bonus: milestoneBonus,
        streak_after: result.newStreak,
      });

    if (loginInsertError) {
      const code = (loginInsertError as { code?: string }).code;
      if (code === PG_UNIQUE_VIOLATION) {
        // Race: another request landed the claim first. Re-read profile so we
        // return the up-to-date streak the winning claim just persisted.
        const refreshed = await loadProfileLogin(supabaseAdmin, userId);
        return jsonResponse(
          alreadyClaimedResponse(
            refreshed.current_login_streak,
            refreshed.longest_login_streak,
            input.today
          )
        );
      }
      throw loginInsertError;
    }

    // Persist the streak + last_login_date on the profile.
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        current_login_streak: result.newStreak,
        longest_login_streak: result.newLongestStreak,
        last_login_date: result.newLastLoginDateKey,
      })
      .eq("id", userId);

    if (profileUpdateError) {
      throw profileUpdateError;
    }

    // Mirror score-trivia-attempt's xp_events emission so the leaderboard
    // pipeline sees the daily-login award through the same ledger.
    const { error: xpEventError } = await supabaseAdmin.from("xp_events").insert([
      {
        user_id: userId,
        source_type: "daily_login",
        source_id: null,
        currency_type: "competitive_points",
        amount: result.awarded,
        reason: `Daily login ${input.today}`,
        counts_toward_leaderboard: true,
      },
    ]);

    if (xpEventError) {
      throw xpEventError;
    }

    // Apply card stat bumps: always +1 Hype daily, plus streak-milestone bonuses
    // (7→+3 Hype, 14→+3 Form, 30→+3 Hype). Failure-tolerant: login is
    // authoritative even if the RPC fails. Only on the shouldClaim path —
    // same-day duplicates already returned early above.
    await safeApplyCardStatBumps(supabaseAdmin, userId, {
      bumps: buildLoginStatBumps(result.newStreak),
    });

    return jsonResponse({
      alreadyClaimedToday: false,
      awarded: result.awarded,
      newStreak: result.newStreak,
      newLongestStreak: result.newLongestStreak,
      milestoneHit: result.milestoneHit,
      newLastLoginDateKey: result.newLastLoginDateKey,
    });
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Unexpected claim-daily-login error.",
      },
      400
    );
  }
});
