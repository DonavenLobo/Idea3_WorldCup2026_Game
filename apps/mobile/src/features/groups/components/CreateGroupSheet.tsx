import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { GroupVisibility } from "@world-cup-game/config";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface CreateGroupSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (input: { name: string; visibility: GroupVisibility }) => void;
}

const MAX_NAME = 40;

export function CreateGroupSheet({ visible, onDismiss, onSubmit }: CreateGroupSheetProps) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<GroupVisibility>("private");
  const trimmed = name.trim();
  const canSubmit = trimmed.length >= 2;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ name: trimmed, visibility });
    setName("");
    setVisibility("private");
  };

  const handleDismiss = () => {
    setName("");
    setVisibility("private");
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="pageSheet"
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <SafeAreaView style={styles.root} edges={["bottom"]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
        >
          <View style={styles.header}>
            <Pressable onPress={handleDismiss}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.title}>Create Group</Text>
            <View style={styles.spacer} />
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.eyebrow}>NEW GROUP</Text>
            <Text style={styles.heading}>Start your own group.</Text>
            <Text style={styles.subhead}>
              Invite friends to predict together and compare brackets.
            </Text>

            <View style={styles.section}>
              <Text style={styles.label}>Group name</Text>
              <TextInput
                style={styles.input}
                placeholder="Sunday Squad"
                placeholderTextColor="rgba(12, 59, 46, 0.4)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
                maxLength={MAX_NAME}
              />
              <Text style={styles.counter}>
                {trimmed.length}/{MAX_NAME}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Visibility</Text>
              <View style={styles.toggleRow}>
                <VisibilityChip
                  label="Private"
                  description="Invite-only"
                  active={visibility === "private"}
                  onPress={() => setVisibility("private")}
                />
                <VisibilityChip
                  label="Public"
                  description="Discoverable"
                  active={visibility === "public"}
                  onPress={() => setVisibility("public")}
                />
              </View>
            </View>

            <Pressable
              style={[styles.submit, !canSubmit ? styles.submitDisabled : null]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <Text style={styles.submitText}>Create Group</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function VisibilityChip({
  label,
  description,
  active,
  onPress
}: {
  label: string;
  description: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[chipStyles.root, active ? chipStyles.active : null]}
      onPress={onPress}
    >
      <Text style={[chipStyles.label, active ? chipStyles.labelActive : null]}>
        {label}
      </Text>
      <Text style={[chipStyles.description, active ? chipStyles.descriptionActive : null]}>
        {description}
      </Text>
    </Pressable>
  );
}

const chipStyles = StyleSheet.create({
  active: {
    backgroundColor: colors.gold,
    borderColor: colors.gold
  },
  description: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2
  },
  descriptionActive: {
    color: "rgba(12, 59, 46, 0.7)"
  },
  label: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "900"
  },
  labelActive: {
    color: colors.pitch
  },
  root: {
    backgroundColor: "rgba(255, 248, 234, 0.08)",
    borderColor: "rgba(255, 248, 234, 0.15)",
    borderRadius: 14,
    borderWidth: 2,
    flex: 1,
    padding: 14
  }
});

const styles = StyleSheet.create({
  cancel: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "700"
  },
  content: {
    padding: spacing.lg
  },
  counter: {
    alignSelf: "flex-end",
    color: "rgba(255, 248, 234, 0.5)",
    fontSize: 12,
    marginTop: 4
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  heading: {
    color: colors.cream,
    fontSize: 26,
    fontWeight: "900",
    marginTop: spacing.xs
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: radius.md,
    color: colors.pitch,
    fontSize: 18,
    fontWeight: "700",
    marginTop: spacing.xs,
    padding: spacing.md
  },
  kav: {
    flex: 1
  },
  label: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  },
  section: {
    marginTop: spacing.lg
  },
  spacer: {
    width: 60
  },
  subhead: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 14,
    marginTop: spacing.xs
  },
  submit: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    marginTop: spacing.xl,
    padding: spacing.md
  },
  submitDisabled: {
    opacity: 0.4
  },
  submitText: {
    color: colors.pitch,
    fontSize: 17,
    fontWeight: "900"
  },
  title: {
    color: colors.cream,
    fontSize: 18,
    fontWeight: "900"
  },
  toggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm
  }
});
