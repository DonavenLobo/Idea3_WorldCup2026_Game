import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { opacity } from "../../../theme/colors";
import { triggerSelection, triggerWarning } from "../../../lib/haptics";
import { blockUser, submitContentReport, type ReportContext } from "../api/moderation";

const REPORT_REASONS = [
  "Inappropriate content",
  "Harassment or bullying",
  "Spam or scam",
] as const;

interface MemberActionsProps {
  userId: string;
  displayName: string;
  context: ReportContext;
  contextId?: string | null;
}

export function MemberActions({
  userId,
  displayName,
  context,
  contextId,
}: MemberActionsProps) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const refreshAfterBlock = () => {
    void queryClient.invalidateQueries({ queryKey: ["blocked-users"] });
    void queryClient.invalidateQueries({ queryKey: ["groups", "members"] });
    void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  };

  const submitReport = async (reason: string) => {
    setBusy(true);

    try {
      await submitContentReport({ context, contextId, reason, reportedUserId: userId });
      Alert.alert(
        "Report received",
        "Thanks for flagging this. Our team reviews reports within 24 hours."
      );
    } catch (error) {
      Alert.alert(
        "Couldn't send report",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const performBlock = async () => {
    setBusy(true);

    try {
      await blockUser(userId);
      refreshAfterBlock();
    } catch (error) {
      Alert.alert(
        "Couldn't block",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const openReportReasons = () => {
    Alert.alert(`Report ${displayName}`, "Why are you reporting this person?", [
      ...REPORT_REASONS.map((reason) => ({
        onPress: () => void submitReport(reason),
        text: reason,
      })),
      { style: "cancel" as const, text: "Cancel" },
    ]);
  };

  const confirmBlock = () => {
    triggerWarning();
    Alert.alert(
      `Block ${displayName}?`,
      "You won't see this person on leaderboards or member lists. You can unblock them anytime from this group.",
      [
        { style: "cancel", text: "Cancel" },
        { onPress: () => void performBlock(), style: "destructive", text: "Block" },
      ]
    );
  };

  const openMenu = () => {
    triggerSelection();
    Alert.alert(displayName, undefined, [
      { onPress: openReportReasons, text: "Report" },
      { onPress: confirmBlock, style: "destructive", text: "Block" },
      { style: "cancel", text: "Cancel" },
    ]);
  };

  return (
    <Pressable
      accessibilityLabel={`Report or block ${displayName}`}
      accessibilityRole="button"
      disabled={busy}
      hitSlop={8}
      onPress={openMenu}
      style={styles.button}
    >
      <Text style={styles.dots}>⋯</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  dots: {
    color: opacity.ink55,
    fontSize: 20,
    fontWeight: "700",
  },
});
