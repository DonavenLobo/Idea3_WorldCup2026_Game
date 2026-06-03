import { useRouter } from "expo-router";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APP_ROUTES } from "@world-cup-game/config";
import { useBracket } from "../../features/bracket";
import { useGroups } from "../../features/groups";
import { useLockerRoom } from "../../features/locker-room";
import { useOnboarding } from "../../features/onboarding";
import { useTrivia } from "../../features/trivia";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { spacing } from "../../theme/spacing";

interface ProfileSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export function ProfileSheet({ visible, onDismiss }: ProfileSheetProps) {
  const router = useRouter();
  const { displayName, nation, photoSource, reset: resetOnboarding } = useOnboarding();
  const { resetAll: resetTrivia } = useTrivia();
  const { resetAll: resetBracket } = useBracket();
  const { resetAll: resetGroups } = useGroups();
  const { resetAll: resetLocker } = useLockerRoom();

  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  const handleEditCard = () => {
    onDismiss();
    router.push(APP_ROUTES.onboarding.selectNation);
  };

  const handleSignOut = () => {
    resetTrivia();
    resetBracket();
    resetGroups();
    resetLocker();
    resetOnboarding();
    onDismiss();
    // Splash route re-runs onboarding from scratch.
    router.replace("/");
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Profile</Text>
          <Pressable onPress={onDismiss} hitSlop={8}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            {photoSource?.uri ? (
              <Image source={{ uri: photoSource.uri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitial}>{initial}</Text>
            )}
          </View>
          <Text style={styles.name}>{displayName.trim() || "Anonymous"}</Text>
          <Text style={styles.nation}>
            {nation ? `${nation.flagEmoji}  ${nation.name}` : "No nation selected"}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={handleEditCard}>
            <Text style={styles.actionLabel}>✏️  Edit my card</Text>
            <Text style={styles.actionHint}>Rebuild your card from onboarding.</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={[styles.action, styles.actionDanger]}
            onPress={handleSignOut}
          >
            <Text style={styles.actionLabelDanger}>↩️  Sign out</Text>
            <Text style={styles.actionHint}>Clears your session and starts onboarding again.</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>Mock app — no real backend yet.</Text>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  action: {
    paddingVertical: spacing.md
  },
  actionDanger: {
    paddingTop: spacing.md
  },
  actionHint: {
    color: "rgba(255, 248, 234, 0.55)",
    fontSize: 13,
    marginTop: 2
  },
  actionLabel: {
    color: colors.cream,
    fontSize: 17,
    fontWeight: "800"
  },
  actionLabelDanger: {
    color: "#FF7B6B",
    fontSize: 17,
    fontWeight: "800"
  },
  actions: {
    backgroundColor: "rgba(255, 248, 234, 0.04)",
    borderColor: "rgba(255, 248, 234, 0.08)",
    borderRadius: radius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "rgba(214, 161, 30, 0.18)",
    borderColor: colors.gold,
    borderRadius: 999,
    borderWidth: 3,
    height: 96,
    justifyContent: "center",
    overflow: "hidden",
    width: 96
  },
  avatarImage: {
    height: "100%",
    width: "100%"
  },
  avatarInitial: {
    color: colors.gold,
    fontSize: 36,
    fontWeight: "900"
  },
  divider: {
    backgroundColor: "rgba(255, 248, 234, 0.08)",
    height: 1,
    marginVertical: spacing.xs
  },
  done: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: "900"
  },
  footer: {
    color: "rgba(255, 248, 234, 0.4)",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: spacing.xl,
    textAlign: "center"
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  headerSpacer: {
    width: 50
  },
  headerTitle: {
    color: colors.cream,
    fontSize: 18,
    fontWeight: "900"
  },
  identity: {
    alignItems: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg
  },
  name: {
    color: colors.cream,
    fontSize: 28,
    fontWeight: "900",
    marginTop: spacing.md
  },
  nation: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  }
});
