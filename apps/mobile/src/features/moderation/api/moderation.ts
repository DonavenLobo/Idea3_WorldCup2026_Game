import { supabase } from "../../../lib/supabase";

export type ReportContext = "group_member" | "card" | "leaderboard" | "other";

export interface SubmitContentReportInput {
  reportedUserId: string;
  context: ReportContext;
  contextId?: string | null;
  reason: string;
  details?: string | null;
}

const UNIQUE_VIOLATION = "23505";

async function getCurrentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("You must be signed in to do that.");
  }

  return data.user.id;
}

export async function submitContentReport(
  input: SubmitContentReportInput
): Promise<void> {
  const reporterId = await getCurrentUserId();
  const { error } = await supabase.from("content_reports").insert({
    reporter_id: reporterId,
    reported_user_id: input.reportedUserId,
    context: input.context,
    context_id: input.contextId ?? null,
    reason: input.reason,
    details: input.details ?? null
  });

  if (error) {
    throw error;
  }
}

export async function blockUser(blockedUserId: string): Promise<void> {
  const blockerId = await getCurrentUserId();
  const { error } = await supabase.from("user_blocks").insert({
    blocker_id: blockerId,
    blocked_user_id: blockedUserId
  });

  // A repeat block is a no-op, not an error.
  if (error && error.code !== UNIQUE_VIOLATION) {
    throw error;
  }
}

export async function unblockUser(blockedUserId: string): Promise<void> {
  const blockerId = await getCurrentUserId();
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_user_id", blockedUserId);

  if (error) {
    throw error;
  }
}

export async function listBlockedUserIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_user_id");

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    (row: { blocked_user_id: string }) => row.blocked_user_id
  );
}
