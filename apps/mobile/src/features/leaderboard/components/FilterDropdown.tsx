import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

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

export function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onSelect
}: FilterDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.id === value);

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.trigger} onPress={() => setOpen(true)}>
        <View style={styles.triggerText}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {current?.label ?? value}
          </Text>
        </View>
        <Text style={styles.chevron}>▼</Text>
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
                    style={[styles.option, active ? styles.optionActive : null]}
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
    padding: spacing.lg
  },
  check: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900"
  },
  chevron: {
    color: "rgba(12, 59, 46, 0.6)",
    fontSize: 12
  },
  label: {
    color: "rgba(12, 59, 46, 0.6)",
    fontSize: 12,
    fontWeight: "700"
  },
  option: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md
  },
  optionActive: {
    backgroundColor: "rgba(214, 161, 30, 0.18)"
  },
  optionText: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "700"
  },
  optionTextActive: {
    fontWeight: "900"
  },
  optionsScroll: {
    maxHeight: 360
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    maxHeight: 480,
    padding: spacing.md,
    width: "100%"
  },
  sheetTitle: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm
  },
  trigger: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md
  },
  triggerText: {
    flex: 1,
    marginRight: spacing.sm
  },
  value: {
    color: colors.pitch,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2
  },
  wrap: {
    flex: 1
  }
});
