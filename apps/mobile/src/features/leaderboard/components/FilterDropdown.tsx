import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { pressableFeedback } from "../../../theme/pressable";
import { typography } from "../../../theme/typography";

export interface FilterOption<T extends string> {
  id: T;
  label: string;
}

interface FilterDropdownProps<T extends string> {
  label: string;
  value: T;
  options: readonly FilterOption<T>[];
  onSelect: (id: T) => void;
}

const LABEL_SLOT_HEIGHT = 32;

export function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onSelect,
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.trigger, pressed && pressableFeedback(true)]}
        onPress={() => setOpen(true)}
      >
        <View style={styles.labelSlot}>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.value} numberOfLines={1}>
            {current?.label ?? value}
          </Text>
          <Text style={styles.chevron}>▾</Text>
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView style={styles.optionsScroll}>
              {options.map((opt) => {
                const active = opt.id === value;
                return (
                  <Pressable
                    key={opt.id}
                    style={({ pressed }) => [
                      styles.option,
                      active ? styles.optionActive : null,
                      pressed && pressableFeedback(true),
                    ]}
                    onPress={() => {
                      onSelect(opt.id);
                      setOpen(false);
                    }}
                  >
                    <Text
                      style={[styles.optionText, active ? styles.optionTextActive : null]}
                    >
                      {opt.label}
                    </Text>
                    {active ? <Text style={styles.check}>✓</Text> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  check: {
    ...typography.label,
    color: colors.red,
  },
  chevron: {
    ...typography.caption,
    color: opacity.ink55,
    marginLeft: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: opacity.ink55,
    fontFamily: typography.label.fontFamily,
  },
  labelSlot: {
    height: LABEL_SLOT_HEIGHT,
    justifyContent: "flex-end",
  },
  option: {
    alignItems: "center",
    borderRadius: radius.card,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  optionActive: {
    backgroundColor: opacity.red18,
  },
  optionText: {
    ...typography.bodyDefault,
    color: colors.ink,
    fontFamily: typography.label.fontFamily,
  },
  optionTextActive: {
    color: colors.ink,
  },
  optionsScroll: {
    maxHeight: 360,
  },
  sheet: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    maxHeight: 480,
    padding: spacing.md,
    width: "100%",
  },
  sheetTitle: {
    ...typography.headingCard,
    color: colors.ink,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  trigger: {
    backgroundColor: colors.cream,
    borderRadius: radius.card,
    padding: spacing.md,
  },
  value: {
    ...typography.label,
    color: colors.ink,
    flex: 1,
    minWidth: 0,
  },
  valueRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.xs,
  },
  wrap: {
    flex: 1,
  },
});
