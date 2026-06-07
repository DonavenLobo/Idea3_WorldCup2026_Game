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
import { BrandButton } from "../../../components/brand";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { typography } from "../../../theme/typography";

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

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.icon}>👤＋</Text>
            <Text style={styles.label}>Have an invite code?</Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., ABC2XYZ9"
              placeholderTextColor={opacity.ink35}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            <BrandButton
              label="Join"
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={styles.submit}
            />

            <Text style={styles.hint}>
              Codes are case-insensitive. Ask your group owner for the invite code.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cancel: {
    ...typography.body,
    color: colors.ink,
    fontFamily: typography.eyebrow.fontFamily,
  },
  cancelSpacer: {
    width: 60
  },
  content: {
    alignItems: "center",
    flexGrow: 1,
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
    ...typography.footnote,
    color: opacity.ink55,
    fontStyle: "italic",
    marginTop: spacing.md,
    textAlign: "center"
  },
  icon: {
    fontSize: 44,
    marginBottom: spacing.md
  },
  input: {
    ...typography.input,
    backgroundColor: colors.cream,
    borderRadius: radius.pill,
    color: colors.ink,
    fontFamily: typography.eyebrow.fontFamily,
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
    ...typography.body,
    color: opacity.ink85,
    fontFamily: typography.eyebrow.fontFamily,
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  },
  submit: {
    marginTop: spacing.lg,
    width: "100%"
  },
  title: {
    ...typography.sectionHeading,
    color: colors.ink,
  }
});
