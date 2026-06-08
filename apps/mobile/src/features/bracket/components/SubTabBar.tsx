import { useEffect, useRef } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { FilterPill } from "../../../components/brand/FilterPill";
import { spacing } from "../../../theme/spacing";
import type { SubTab } from "../types";

export interface SubTabItem {
  id: SubTab;
  label: string;
  isLocked?: boolean;
  disabled?: boolean;
  phase2Hint?: boolean;
}

const TABS: readonly SubTabItem[] = [
  { id: "summary", label: "My Bracket" },
  { id: "groups", label: "Groups" },
  { id: "r32", label: "R32" },
  { id: "r16", label: "R16" },
  { id: "qf", label: "QF" },
  { id: "sf", label: "SF" },
  { id: "final", label: "Final" },
  { id: "third", label: "3rd" },
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
        const label = `${tab.phase2Hint ? "P2 " : ""}${tab.label}${tab.isLocked ? " Locked" : ""}`;
        return (
          <FilterPill
            key={tab.id}
            disabled={tab.disabled}
            label={label}
            selected={tab.id === value}
            onLayout={(e) => {
              positions.current[tab.id] = e.nativeEvent.layout.x;
            }}
            onPress={() => onChange(tab.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0
  },
  scrollContent: {
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  }
});
