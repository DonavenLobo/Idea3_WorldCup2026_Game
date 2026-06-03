import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

interface JoinByCodeSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (code: string) => void | Promise<void>;
}

export function JoinByCodeSheet({ visible, onDismiss, onSubmit }: JoinByCodeSheetProps) {
  const [code, setCode] = useState("");
  const trimmed = code.trim();
  const canSubmit = trimmed.length >= 4;

  const handleSubmit = () => {
    if (!canSubmit) return;
    void onSubmit(trimmed.toUpperCase());
    setCode("");
  };

  const handleDismiss = () => {
    setCode("");
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
            <Text style={styles.title}>Join a Group</Text>
            <View style={styles.cancelSpacer} />
          </View>

          <View style={styles.content}>
            <Text style={styles.icon}>👤＋</Text>
            <Text style={styles.label}>Have an invite code?</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., ABC2XYZ9"
              placeholderTextColor="rgba(12, 59, 46, 0.4)"
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            <Pressable
              style={[styles.submit, !canSubmit ? styles.submitDisabled : null]}
              onPress={handleSubmit}
              disabled={!canSubmit}
            >
              <Text style={styles.submitText}>Join</Text>
            </Pressable>

            <Text style={styles.hint}>
              Codes are case-insensitive. Ask your group owner for the invite code.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cancel: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "700"
  },
  cancelSpacer: {
    width: 60
  },
  content: {
    alignItems: "center",
    padding: spacing.xl
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  hint: {
    color: "rgba(255, 248, 234, 0.55)",
    fontSize: 12,
    fontStyle: "italic",
    marginTop: spacing.md,
    textAlign: "center"
  },
  icon: {
    fontSize: 44,
    marginBottom: spacing.md
  },
  input: {
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    color: colors.pitch,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 4,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    textAlign: "center",
    width: "100%"
  },
  kav: {
    flex: 1
  },
  label: {
    color: "rgba(255, 248, 234, 0.85)",
    fontSize: 16,
    fontWeight: "700"
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  },
  submit: {
    alignItems: "center",
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    width: "100%"
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
  }
});
