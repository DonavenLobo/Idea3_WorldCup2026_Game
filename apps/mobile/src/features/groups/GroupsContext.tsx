import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import { PUBLIC_GROUPS } from "@world-cup-game/config";
import type { GroupVisibility } from "@world-cup-game/config";
import type { JoinedGroup } from "./types";

interface CreateGroupInput {
  name: string;
  visibility: GroupVisibility;
}

interface GroupsContextValue {
  joinedGroups: JoinedGroup[];
  joinedIds: Set<string>;
  isJoined: (id: string) => boolean;
  joinPublicGroup: (id: string) => void;
  leaveGroup: (id: string) => void;
  joinByCode: (code: string) => JoinedGroup | null;
  createGroup: (input: CreateGroupInput) => JoinedGroup;
  getGroupById: (id: string) => JoinedGroup | null;
  resetAll: () => void;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

function generateInviteCode(seed: string): string {
  // Deterministic 6-char A-Z/0-9 invite code from the seed string.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += alphabet.charAt(hash % alphabet.length);
    hash = Math.floor(hash / alphabet.length) || hash * 17;
  }
  return out;
}

export function GroupsProvider({ children }: PropsWithChildren) {
  const [joinedIds, setJoinedIds] = useState<Set<string>>(() => new Set());
  const [customGroups, setCustomGroups] = useState<JoinedGroup[]>([]);

  const isJoined = useCallback(
    (id: string) => joinedIds.has(id),
    [joinedIds]
  );

  const joinPublicGroup = useCallback((id: string) => {
    setJoinedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const leaveGroup = useCallback((id: string) => {
    setJoinedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setCustomGroups((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const joinByCode = useCallback((code: string): JoinedGroup | null => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length === 0) return null;
    const id = `code-${trimmed.toLowerCase()}`;
    const newGroup: JoinedGroup = {
      id,
      name: `Group ${trimmed}`,
      memberCount: Math.floor(Math.abs(trimmed.length * 13)) + 3,
      visibility: "private",
      isCustom: true,
      inviteCode: trimmed
    };
    setCustomGroups((prev) => {
      if (prev.some((g) => g.id === id)) return prev;
      return [...prev, newGroup];
    });
    setJoinedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    return newGroup;
  }, []);

  const createGroup = useCallback((input: CreateGroupInput): JoinedGroup => {
    const safeName = input.name.trim() || "New Group";
    const idStub = `${safeName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${customGroups.length}`;
    const id = `custom-${idStub}`;
    const inviteCode = generateInviteCode(idStub);
    const newGroup: JoinedGroup = {
      id,
      name: safeName,
      memberCount: 1,
      visibility: input.visibility,
      isCustom: true,
      inviteCode
    };
    setCustomGroups((prev) => [...prev, newGroup]);
    setJoinedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    return newGroup;
  }, [customGroups.length]);

  const joinedGroups = useMemo<JoinedGroup[]>(() => {
    const fromPublic = PUBLIC_GROUPS.filter((p) => joinedIds.has(p.id)).map((p) => ({
      id: p.id,
      name: p.name,
      memberCount: p.memberCount,
      visibility: p.visibility,
      isFeatured: p.isFeatured
    }));
    return [...fromPublic, ...customGroups.filter((g) => joinedIds.has(g.id))];
  }, [joinedIds, customGroups]);

  const getGroupById = useCallback(
    (id: string): JoinedGroup | null => {
      const pg = PUBLIC_GROUPS.find((p) => p.id === id);
      if (pg) {
        return {
          id: pg.id,
          name: pg.name,
          memberCount: pg.memberCount,
          visibility: pg.visibility,
          isFeatured: pg.isFeatured
        };
      }
      return customGroups.find((g) => g.id === id) ?? null;
    },
    [customGroups]
  );

  const resetAll = useCallback(() => {
    setJoinedIds(new Set());
    setCustomGroups([]);
  }, []);

  const value = useMemo<GroupsContextValue>(
    () => ({
      joinedGroups,
      joinedIds,
      isJoined,
      joinPublicGroup,
      leaveGroup,
      joinByCode,
      createGroup,
      getGroupById,
      resetAll
    }),
    [
      joinedGroups,
      joinedIds,
      isJoined,
      joinPublicGroup,
      leaveGroup,
      joinByCode,
      createGroup,
      getGroupById,
      resetAll
    ]
  );

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
}

export function useGroups(): GroupsContextValue {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error("useGroups must be used within a GroupsProvider.");
  return ctx;
}
