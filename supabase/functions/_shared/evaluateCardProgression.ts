import { createClient } from "npm:@supabase/supabase-js@2";
import {
  calculateCardProgressionLevel,
  getUpgradeSteps,
  milestonesFromTimestamps,
  progressionLevelFromTemplateKey,
  templateKeyForLevel,
  type CardProgressionLevel,
} from "./cardProgression.ts";

type SupabaseClient = ReturnType<typeof createClient<any>>;

interface MilestoneRow {
  first_trivia_completed_at: string | null;
  bracket_groups_finalized_at: string | null;
}

interface CardRow {
  id: string;
  template_id: string;
}

interface TemplateRow {
  template_key: string;
}

interface PendingUpgradeEventRow {
  id: string;
  from_level: number;
  to_level: number;
  sequence: number;
  created_at: string;
}

export interface EvaluateCardProgressionInput {
  userId: string;
  markFirstTrivia?: boolean;
  markBracketGroupsFinalized?: boolean;
}

export interface CardUpgradeEventPayload {
  id: string;
  fromLevel: CardProgressionLevel;
  toLevel: CardProgressionLevel;
  sequence: number;
  createdAt: string;
}

export interface EvaluateCardProgressionResult {
  newLevel: CardProgressionLevel;
  pendingUpgrades: CardUpgradeEventPayload[];
}

async function markMilestones(
  supabaseAdmin: SupabaseClient,
  userId: string,
  input: EvaluateCardProgressionInput
): Promise<MilestoneRow> {
  // Single atomic statement (see migration 000034). This is race-free against a
  // concurrent trivia/bracket call and never overwrites an existing timestamp.
  const { data, error } = await supabaseAdmin.rpc("mark_card_progression_milestones", {
    p_user_id: userId,
    p_mark_first_trivia: input.markFirstTrivia ?? false,
    p_mark_bracket_groups_finalized: input.markBracketGroupsFinalized ?? false,
  });

  if (error) {
    throw error;
  }

  const row = (Array.isArray(data) ? data[0] : data) as MilestoneRow | null;

  if (!row) {
    throw new Error("Failed to record card progression milestones.");
  }

  return {
    first_trivia_completed_at: row.first_trivia_completed_at ?? null,
    bracket_groups_finalized_at: row.bracket_groups_finalized_at ?? null,
  };
}

async function loadUserCard(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<CardRow | null> {
  const { data, error } = await supabaseAdmin
    .from("cards")
    .select("id, template_id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<CardRow>();

  if (error) {
    throw error;
  }

  return data;
}

async function loadTemplateKey(
  supabaseAdmin: SupabaseClient,
  templateId: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("card_templates")
    .select("template_key")
    .eq("id", templateId)
    .maybeSingle<TemplateRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Card template not found.");
  }

  return data.template_key;
}

async function loadTemplateIdByKey(
  supabaseAdmin: SupabaseClient,
  templateKey: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("card_templates")
    .select("id")
    .eq("template_key", templateKey)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(`Missing card template ${templateKey}.`);
  }

  return data.id;
}

async function loadPendingUpgradeEvents(
  supabaseAdmin: SupabaseClient,
  userId: string
): Promise<CardUpgradeEventPayload[]> {
  const { data, error } = await supabaseAdmin
    .from("card_upgrade_events")
    .select("id, from_level, to_level, sequence, created_at")
    .eq("user_id", userId)
    .is("animation_seen_at", null)
    .order("created_at", { ascending: true })
    .order("sequence", { ascending: true })
    .returns<PendingUpgradeEventRow[]>();

  if (error) {
    throw error;
  }

  return data.map((row) => ({
    id: row.id,
    fromLevel: row.from_level as CardProgressionLevel,
    toLevel: row.to_level as CardProgressionLevel,
    sequence: row.sequence,
    createdAt: row.created_at,
  }));
}

export async function evaluateCardProgression(
  supabaseAdmin: SupabaseClient,
  input: EvaluateCardProgressionInput
): Promise<EvaluateCardProgressionResult> {
  const milestonesRow = await markMilestones(supabaseAdmin, input.userId, input);
  const milestones = milestonesFromTimestamps(milestonesRow);
  const newLevel = calculateCardProgressionLevel(milestones);

  const card = await loadUserCard(supabaseAdmin, input.userId);
  if (!card) {
    return { newLevel, pendingUpgrades: [] };
  }

  const currentTemplateKey = await loadTemplateKey(supabaseAdmin, card.template_id);
  const currentLevel = progressionLevelFromTemplateKey(currentTemplateKey);

  if (newLevel > currentLevel) {
    const targetTemplateId = await loadTemplateIdByKey(
      supabaseAdmin,
      templateKeyForLevel(newLevel)
    );

    const { error: cardUpdateError } = await supabaseAdmin
      .from("cards")
      .update({
        template_id: targetTemplateId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", card.id);

    if (cardUpdateError) {
      throw cardUpdateError;
    }

    const steps = getUpgradeSteps(currentLevel, newLevel);

    for (const [index, step] of steps.entries()) {
      const { error: insertError } = await supabaseAdmin.from("card_upgrade_events").insert({
        user_id: input.userId,
        card_id: card.id,
        from_level: step.from,
        to_level: step.to,
        sequence: index + 1,
      });

      // A pending event for this step already exists (unique partial index).
      // That is the desired end state, so treat the conflict as success.
      if (insertError && insertError.code !== "23505") {
        throw insertError;
      }
    }
  }

  const pendingUpgrades = await loadPendingUpgradeEvents(supabaseAdmin, input.userId);
  return { newLevel, pendingUpgrades };
}
