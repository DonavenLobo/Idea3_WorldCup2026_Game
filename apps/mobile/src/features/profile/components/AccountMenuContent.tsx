import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { SUPPORTED_NATIONS } from "@world-cup-game/config";
import { BrandButton, Eyebrow } from "../../../components/brand";
import { accountMenuIconSources } from "../../../components/icons/accountMenuIconSources";
import { TeamLogo } from "../../../components/team";
import { triggerLightImpact, triggerSelection } from "../../../lib/haptics";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { pressableFeedback } from "../../../theme/pressable";
import { spacing } from "../../../theme/spacing";
import { fontFamily, typography } from "../../../theme/typography";
import { MenuBrandIcon } from "./MenuBrandIcon";

export interface AccountMenuContentProps {
  creditBalance?: number;
  leaderboardScore?: number;
  displayName: string;
  email?: string | null;
  imageUri?: string | null;
  nationCode?: string;
  overall?: number;
  onDone: () => void;
  onOpenCard: () => void;
  onOpenLeaderboard: () => void;
  onOpenLockerRoom: () => void;
  onRequestSignOut: () => void;
  onRequestDeleteAccount: () => void;
}

interface AccountAction {
  iconSource?: ImageSourcePropType;
  label: string;
  onPress: () => void;
  trailing?: string;
}

export function AccountMenuContent({
  leaderboardScore = 0,
  displayName,
  email,
  imageUri,
  nationCode,
  overall,
  onDone,
  onOpenCard,
  onOpenLeaderboard,
  onOpenLockerRoom,
  onRequestSignOut,
  onRequestDeleteAccount,
}: AccountMenuContentProps) {
  const nation = SUPPORTED_NATIONS.find((candidate) => candidate.code === nationCode);
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  const actions: AccountAction[] = [
    { iconSource: accountMenuIconSources.card, label: "My Card", onPress: onOpenCard },
    {
      iconSource: accountMenuIconSources.groups,
      label: "Leaderboard",
      onPress: onOpenLeaderboard,
      trailing: `${leaderboardScore.toLocaleString()} pts`,
    },
    {
      iconSource: accountMenuIconSources.home,
      label: "Locker Room",
      onPress: onOpenLockerRoom,
      trailing: "Soon",
    },
  ];

  const handleActionPress = (onPress: () => void) => {
    triggerSelection();
    onPress();
  };

  const handleClose = () => {
    triggerLightImpact();
    onDone();
  };

  return (
    <View accessibilityViewIsModal style={styles.root}>
      <View style={styles.sheetHeader}>
        <Eyebrow accent="blue" label="YOUR ACCOUNT" />
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{initial}</Text>
          )}
        </View>

        <Text numberOfLines={1} style={styles.displayName}>
          {displayName || "GoGaffa Player"}
        </Text>

        {email ? (
          <Text numberOfLines={1} style={styles.email}>
            {email}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {nation ? (
            <View style={styles.metaChip}>
              <TeamLogo code={nation.code} name={nation.name} size={18} />
              <Text style={styles.metaText}>{nation.code}</Text>
            </View>
          ) : null}
          {typeof overall === "number" ? (
            <View style={[styles.metaChip, styles.ovrChip]}>
              <Text style={styles.ovrLabel}>OVR</Text>
              <Text style={styles.ovrValue}>{overall}</Text>
            </View>
          ) : null}
          <View style={[styles.metaChip, styles.pointsChip]}>
            <Text style={styles.pointsLabel}>SCORE</Text>
            <Text style={styles.pointsValue}>{leaderboardScore.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.groupedList}>
        {actions.map((action, index) => (
          <AccountMenuRow
            key={action.label}
            action={action}
            onPress={() => handleActionPress(action.onPress)}
            showDivider={index < actions.length - 1}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <BrandButton label="Close" onPress={handleClose} variant="secondary" />
        <Pressable
          accessibilityRole="button"
          onPress={() => handleActionPress(onRequestSignOut)}
          style={({ pressed }) => [styles.signOutRow, pressed && pressableFeedback(true)]}
        >
          <Text style={styles.signOutLabel}>Sign out</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => handleActionPress(onRequestDeleteAccount)}
          style={({ pressed }) => [styles.deleteRow, pressed && pressableFeedback(true)]}
        >
          <Text style={styles.deleteLabel}>Delete account</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AccountMenuRow({
  action,
  onPress,
  showDivider,
}: {
  action: AccountAction;
  onPress: () => void;
  showDivider: boolean;
}) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.actionRow, pressed && pressableFeedback(true)]}
      >
        <MenuBrandIcon source={action.iconSource} />
        <Text style={styles.actionLabel}>{action.label}</Text>
        {action.trailing ? (
          <Text style={styles.actionTrailing}>{action.trailing}</Text>
        ) : null}
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      {showDivider ? <View style={styles.rowDivider} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  actionLabel: {
    ...typography.label,
    color: colors.ink,
    flex: 1,
    marginLeft: spacing.md,
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionTrailing: {
    ...typography.caption,
    color: opacity.ink55,
    fontFamily: fontFamily.interSemiBold,
    marginRight: spacing.xs,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  avatarInitial: {
    color: colors.red,
    fontFamily: fontFamily.caveatBold,
    fontSize: 26,
  },
  avatarWrap: {
    alignItems: "center",
    backgroundColor: opacity.red18,
    borderColor: colors.red,
    borderRadius: 20,
    borderWidth: 2,
    height: 56,
    justifyContent: "center",
    overflow: "hidden",
    width: 56,
  },
  chevron: {
    color: opacity.ink35,
    fontFamily: fontFamily.interSemiBold,
    fontSize: 20,
    lineHeight: 22,
  },
  displayName: {
    ...typography.titleScreen,
    color: colors.ink,
    fontSize: 22,
    lineHeight: 26,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  email: {
    ...typography.caption,
    color: opacity.ink55,
    marginTop: 2,
    textAlign: "center",
  },
  footer: {
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  groupedList: {
    backgroundColor: opacity.ink10,
    borderColor: opacity.ink10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    overflow: "hidden",
  },
  metaChip: {
    alignItems: "center",
    backgroundColor: opacity.ink10,
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  metaText: {
    ...typography.caption,
    color: colors.ink,
    fontFamily: fontFamily.interSemiBold,
    letterSpacing: 0.6,
  },
  ovrChip: {
    backgroundColor: opacity.red18,
  },
  ovrLabel: {
    ...typography.caption,
    color: colors.red,
    fontFamily: fontFamily.interSemiBold,
    letterSpacing: 0.6,
  },
  ovrValue: {
    ...typography.dataValue,
    color: colors.red,
    fontSize: 14,
    lineHeight: 16,
  },
  pointsChip: {
    backgroundColor: "rgba(107, 76, 154, 0.12)",
  },
  pointsLabel: {
    ...typography.caption,
    color: colors.purple,
    fontFamily: fontFamily.interSemiBold,
    letterSpacing: 0.6,
  },
  pointsValue: {
    ...typography.dataValue,
    color: colors.purple,
    fontSize: 14,
    lineHeight: 16,
  },
  profileSection: {
    alignItems: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  root: {
    paddingBottom: spacing.xl,
    paddingTop: spacing.xl,
  },
  rowDivider: {
    backgroundColor: opacity.ink10,
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.md + 24 + spacing.md,
  },
  sheetHeader: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  signOutLabel: {
    ...typography.label,
    color: colors.red,
    textAlign: "center",
  },
  signOutRow: {
    alignItems: "center",
    minHeight: 44,
    paddingVertical: spacing.xs,
  },
  deleteRow: {
    alignItems: "center",
    minHeight: 36,
    paddingVertical: spacing.xs,
  },
  deleteLabel: {
    ...typography.caption,
    color: opacity.ink55,
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
