import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import type { SubTab } from "../types";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

const TABS: readonly { id: SubTab; label: string }[] = [
  { id: "groups", label: "Groups" },
  { id: "r32", label: "R32" },
  { id: "r16", label: "R16" },
  { id: "qf", label: "QF" },
  { id: "sf", label: "SF" },
  { id: "final", label: "Final" },
  { id: "third", label: "3rd" },
  { id: "summary", label: "My Bracket" }
];

interface SubTabBarProps {
  value: SubTab;
  onChange: (next: SubTab) => void;
}

export function SubTabBar({ value, onChange }: SubTabBarProps) {
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});

  // When the active tab changes (manual or auto-advance), bring it into view.
  useEffect(() => {
    const x = positions.current[value];
    if (x !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ x: Math.max(0, x - 60), animated: true });
    }
  }, [value]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <Pressable
            key={tab.id}
            onLayout={(e) => {
              positions.current[tab.id] = e.nativeEvent.layout.x;
            }}
            style={[styles.tab, active ? styles.tabActive : null]}
            onPress={() => onChange(tab.id)}
          >
            <Text
              style={[styles.label, active ? styles.labelActive : null]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "rgba(255, 248, 234, 0.65)",
    fontSize: 13,
    fontWeight: "800"
  },
  labelActive: {
    color: colors.pitch
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 0
  },
  scrollContent: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  tab: {
    alignItems: "center",
    backgroundColor: "rgba(255, 248, 234, 0.08)",
    borderRadius: radius.pill,
    height: 36,
    justifyContent: "center",
    minWidth: 56,
    paddingHorizontal: spacing.md
  },
  tabActive: {
    backgroundColor: colors.gold
  }
});
