import type { UserProfile } from "@world-cup-game/types";
import { getCardUploadDisplayUrl } from "../../../lib/imageUpload";
import { supabase } from "../../../lib/supabase";

interface ProfileRow {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  selected_nation_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertProfileInput {
  displayName: string;
  selectedNationCode: string;
  avatarUrl?: string | null;
}

async function mapProfileRow(row: ProfileRow): Promise<UserProfile> {
  return {
    id: row.id,
    username: row.username ?? "",
    displayName: row.display_name ?? "",
    avatarUrl: await getCardUploadDisplayUrl(row.avatar_url),
    selectedNationCode: row.selected_nation_code ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

const PROFILE_COLUMNS = `
  id,
  username,
  display_name,
  avatar_url,
  selected_nation_code,
  created_at,
  updated_at
`;

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("You must be signed in to load a profile.");
  }

  return data.user.id;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw error;
  }

  return data ? mapProfileRow(data) : null;
}

export async function upsertCurrentProfile(input: UpsertProfileInput): Promise<UserProfile> {
  const userId = await getCurrentUserId();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      display_name: input.displayName,
      selected_nation_code: input.selectedNationCode,
      avatar_url: input.avatarUrl ?? null,
      updated_at: now
    })
    .select(PROFILE_COLUMNS)
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return mapProfileRow(data);
}
