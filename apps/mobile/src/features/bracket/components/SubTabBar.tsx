import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { SubTab } from "../types";
import { colors } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";

export interface SubTabItem {
  id: SubTab;
  label: string;
  isLocked?: boolean;
  phase2Hint?: boolean;
}

const TABS: readonly SubTabItem[] = [
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
  /** Optional override for tab items. Defaults to the internal TABS constant. */
  items?: ReadonlyArray<SubTabItem>;
}

export function SubTabBar({ value, onChange, items }: SubTabBarProps) {
  const tabs = items ?? TABS;
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
      {tabs.map((tab) => {
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
            <View style={styles.tabInner}>
              {tab.phase2Hint ? <Text style={styles.eyebrow}>PHASE 2</Text> : null}
              <Text
                style={[styles.label, active ? styles.labelActive : null]}
                numberOfLines={1}
              >
                {tab.label}
                {tab.isLocked ? <Text style={styles.lockIcon}>  🔒</Text> : null}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1
  },
  label: {
    color: "rgba(255, 248, 234, 0.65)",
    fontSize: 13,
    fontWeight: "800"
  },
  labelActive: {
    color: colors.pitch
  },
  lockIcon: {
    fontSize: 11
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
  },
  tabInner: {
    alignItems: "center"
  }
});
