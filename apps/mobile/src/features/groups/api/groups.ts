import type { GroupVisibility } from "@gogaffa/config";
import { supabase } from "../../../lib/supabase";
import type { JoinedGroup, PublicGroup } from "../types";

export interface CreateGroupInput {
  name: string;
  visibility: GroupVisibility;
}

type GroupRole = "owner" | "admin" | "member";

interface GroupSummaryRow {
  id: string;
  name: string;
  member_count: number | null;
  visibility: GroupVisibility | null;
  is_featured: boolean | null;
  invite_code: string | null;
  role: GroupRole | null;
  default_leaderboard_type: string | null;
}

interface GroupMemberRow {
  user_id: string;
  display_name: string | null;
  country_code: string | null;
  role: GroupRole | null;
  joined_at: string;
}

export interface GroupMember {
  userId: string;
  displayName: string;
  countryCode: string;
  role: GroupRole;
  joinedAt: string;
}

function mapJoinedGroup(row: GroupSummaryRow): JoinedGroup {
  return {
    id: row.id,
    name: row.name,
    memberCount: row.member_count ?? 0,
    visibility: row.visibility ?? "private",
    isFeatured: row.is_featured ?? false,
    inviteCode: row.invite_code ?? undefined,
    role: row.role ?? undefined,
    defaultLeaderboardType: row.default_leaderboard_type ?? undefined
  };
}

function mapPublicGroup(row: GroupSummaryRow): PublicGroup {
  return {
    id: row.id,
    name: row.name,
    memberCount: row.member_count ?? 0,
    visibility: row.visibility ?? "public",
    isFeatured: row.is_featured ?? false
  };
}

function mapGroupMember(row: GroupMemberRow): GroupMember {
  return {
    userId: row.user_id,
    displayName: row.display_name?.trim() || "Rookie",
    countryCode: row.country_code?.trim() || "USA",
    role: row.role ?? "member",
    joinedAt: row.joined_at
  };
}

function firstGroup(data: GroupSummaryRow[] | null): JoinedGroup | null {
  const first = data?.[0];
  return first ? mapJoinedGroup(first) : null;
}

function normalizeRows(data: unknown): GroupSummaryRow[] {
  return Array.isArray(data) ? data as GroupSummaryRow[] : [];
}

function normalizeMemberRows(data: unknown): GroupMemberRow[] {
  return Array.isArray(data) ? data as GroupMemberRow[] : [];
}

export async function listMyGroups(): Promise<JoinedGroup[]> {
  const { data, error } = await supabase.rpc("list_my_groups");

  if (error) throw error;

  return normalizeRows(data).map(mapJoinedGroup);
}

export async function listPublicGroups(): Promise<PublicGroup[]> {
  const { data, error } = await supabase.rpc("list_public_groups");

  if (error) throw error;

  return normalizeRows(data).map(mapPublicGroup);
}

export async function getGroupDetail(groupId: string): Promise<JoinedGroup | null> {
  const { data, error } = await supabase.rpc("get_group_detail", {
    target_group_id: groupId
  });

  if (error) throw error;

  return firstGroup(normalizeRows(data));
}

export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase.rpc("list_group_members", {
    target_group_id: groupId
  });

  if (error) throw error;

  return normalizeMemberRows(data).map(mapGroupMember);
}

export async function createGroup(input: CreateGroupInput): Promise<JoinedGroup> {
  const { data, error } = await supabase
    .rpc("create_user_group", {
      group_name: input.name,
      group_visibility: input.visibility
    });

  if (error) throw error;

  const group = firstGroup(normalizeRows(data));
  if (!group) throw new Error("Group creation did not return a group.");

  return group;
}

export async function joinGroupByCode(code: string): Promise<JoinedGroup> {
  const { data, error } = await supabase
    .rpc("join_group_by_invite_code", {
      p_invite_code: code
    });

  if (error) throw error;

  const group = firstGroup(normalizeRows(data));
  if (!group) throw new Error("Invite code did not return a group.");

  return group;
}

export async function joinPublicGroup(groupId: string): Promise<JoinedGroup> {
  const { data, error } = await supabase
    .rpc("join_public_group", {
      target_group_id: groupId
    });

  if (error) throw error;

  const group = firstGroup(normalizeRows(data));
  if (!group) throw new Error("Public group join did not return a group.");

  return group;
}

export async function leaveGroup(groupId: string): Promise<void> {
  const { error } = await supabase.rpc("leave_group", {
    target_group_id: groupId
  });

  if (error) throw error;
}
