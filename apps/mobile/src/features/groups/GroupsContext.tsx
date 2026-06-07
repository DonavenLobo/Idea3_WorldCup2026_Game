import { createContext, useCallback, useContext, useMemo } from "react";
import type { PropsWithChildren } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "../auth/hooks/useSession";
import {
  createGroup as createGroupApi,
  joinGroupByCode,
  joinPublicGroup as joinPublicGroupApi,
  leaveGroup as leaveGroupApi,
  listMyGroups,
  listPublicGroups
} from "./api/groups";
import type { CreateGroupInput } from "./api/groups";
import type { JoinedGroup, PublicGroup } from "./types";

interface GroupsContextValue {
  joinedGroups: JoinedGroup[];
  publicGroups: PublicGroup[];
  joinedIds: Set<string>;
  error: Error | null;
  isLoading: boolean;
  isJoined: (id: string) => boolean;
  joinPublicGroup: (id: string) => Promise<JoinedGroup>;
  leaveGroup: (id: string) => Promise<void>;
  joinByCode: (code: string) => Promise<JoinedGroup>;
  createGroup: (input: CreateGroupInput) => Promise<JoinedGroup>;
}

const GROUPS_QUERY_KEY = ["groups"] as const;
const GroupsContext = createContext<GroupsContextValue | null>(null);

function authRequiredError(): Error {
  return new Error("You must be signed in to use groups.");
}

function normalizeError(error: unknown): Error | null {
  if (!error) return null;
  return error instanceof Error ? error : new Error("Failed to load groups.");
}

export function GroupsProvider({ children }: PropsWithChildren) {
  const { user, isLoading: isSessionLoading } = useSession();
  const queryClient = useQueryClient();
  const userId = user?.id ?? null;

  const myGroupsQuery = useQuery({
    queryKey: [...GROUPS_QUERY_KEY, "my", userId],
    enabled: Boolean(userId) && !isSessionLoading,
    queryFn: listMyGroups
  });

  const publicGroupsQuery = useQuery({
    queryKey: [...GROUPS_QUERY_KEY, "public"],
    enabled: Boolean(userId) && !isSessionLoading,
    queryFn: listPublicGroups
  });

  const invalidateGroups = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
  }, [queryClient]);

  const joinPublicMutation = useMutation({
    mutationFn: joinPublicGroupApi,
    onSuccess: invalidateGroups
  });

  const leaveMutation = useMutation({
    mutationFn: leaveGroupApi,
    onSuccess: invalidateGroups
  });

  const joinByCodeMutation = useMutation({
    mutationFn: joinGroupByCode,
    onSuccess: invalidateGroups
  });

  const createGroupMutation = useMutation({
    mutationFn: createGroupApi,
    onSuccess: invalidateGroups
  });

  const joinedGroups = userId ? myGroupsQuery.data ?? [] : [];
  const publicGroups = userId ? publicGroupsQuery.data ?? [] : [];

  const joinedIds = useMemo(
    () => new Set(joinedGroups.map((group) => group.id)),
    [joinedGroups]
  );

  const isJoined = useCallback(
    (id: string) => joinedIds.has(id),
    [joinedIds]
  );

  const joinPublicGroup = useCallback(
    async (id: string) => {
      if (!userId) throw authRequiredError();
      return joinPublicMutation.mutateAsync(id);
    },
    [joinPublicMutation, userId]
  );

  const leaveGroup = useCallback(
    async (id: string) => {
      if (!userId) throw authRequiredError();
      await leaveMutation.mutateAsync(id);
    },
    [leaveMutation, userId]
  );

  const joinByCode = useCallback(
    async (code: string) => {
      if (!userId) throw authRequiredError();
      return joinByCodeMutation.mutateAsync(code);
    },
    [joinByCodeMutation, userId]
  );

  const createGroup = useCallback(
    async (input: CreateGroupInput) => {
      if (!userId) throw authRequiredError();
      return createGroupMutation.mutateAsync(input);
    },
    [createGroupMutation, userId]
  );

  const error = normalizeError(myGroupsQuery.error ?? publicGroupsQuery.error);
  const isLoading =
    isSessionLoading ||
    myGroupsQuery.isLoading ||
    publicGroupsQuery.isLoading ||
    joinPublicMutation.isPending ||
    leaveMutation.isPending ||
    joinByCodeMutation.isPending ||
    createGroupMutation.isPending;

  const value = useMemo<GroupsContextValue>(
    () => ({
      joinedGroups,
      publicGroups,
      joinedIds,
      error,
      isLoading,
      isJoined,
      joinPublicGroup,
      leaveGroup,
      joinByCode,
      createGroup
    }),
    [
      joinedGroups,
      publicGroups,
      joinedIds,
      error,
      isLoading,
      isJoined,
      joinPublicGroup,
      leaveGroup,
      joinByCode,
      createGroup
    ]
  );

  return <GroupsContext.Provider value={value}>{children}</GroupsContext.Provider>;
}

export function useGroups(): GroupsContextValue {
  const ctx = useContext(GroupsContext);
  if (!ctx) throw new Error("useGroups must be used within a GroupsProvider.");
  return ctx;
}
