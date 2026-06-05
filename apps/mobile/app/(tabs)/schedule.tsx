// apps/mobile/app/(tabs)/schedule.tsx
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SUPPORTED_NATIONS } from "@world-cup-game/config";
import { colors } from "../../src/theme/colors";
import { radius } from "../../src/theme/radius";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";
import { supabase } from "../../src/lib/supabase";

// Schedule tab queries the matches table directly for the full row data
// (home/away teams + venue) on top of what useFixtures normalizes for lockout.

interface ScheduleMatch {
  id: string;
  round: string;
  group_id: string | null;
  home_team_code: string | null;
  away_team_code: string | null;
  kickoff: string;
  venue: string | null;
}

function teamLabel(code: string | null): string {
  if (!code) return "TBD";
  const nation = SUPPORTED_NATIONS.find((n) => n.code === code);
  return nation ? `${nation.flagEmoji} ${nation.name}` : code;
}

function roundLabel(round: string): string {
  switch (round) {
    case "group": return "Group Stage";
    case "r32":   return "Round of 32";
    case "r16":   return "Round of 16";
    case "qf":    return "Quarterfinals";
    case "sf":    return "Semifinals";
    case "third": return "3rd Place";
    case "final": return "Final";
    default:      return round.toUpperCase();
  }
}

function formatDateHeader(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

function formatKickoff(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

import { useEffect, useState } from "react";

function useScheduleMatches() {
  const [matches, setMatches] = useState<ScheduleMatch[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("id,round,group_id,home_team_code,away_team_code,kickoff,venue")
        .order("kickoff", { ascending: true });
      if (cancelled) return;
      if (error) {
        setError(error as Error);
        return;
      }
      setMatches((data ?? []) as ScheduleMatch[]);
    })();
    return () => { cancelled = true; };
  }, []);

  return { matches, error };
}

export default function ScheduleScreen() {
  const { matches, error } = useScheduleMatches();

  const grouped = useMemo(() => {
    if (!matches) return null;
    const byDay = new Map<string, ScheduleMatch[]>();
    for (const m of matches) {
      const day = new Date(m.kickoff).toISOString().slice(0, 10);
      const list = byDay.get(day) ?? [];
      list.push(m);
      byDay.set(day, list);
    }
    return Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [matches]);

  if (error) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Couldn't load schedule: {error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!grouped) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Schedule</Text>
        <Text style={styles.subtitle}>
          All confirmed kickoffs. Group-stage matchdays 2 and 3 are coming.
        </Text>
        {grouped.map(([day, dayMatches]) => (
          <View key={day} style={styles.daySection}>
            <Text style={styles.dayHeader}>{formatDateHeader(new Date(day))}</Text>
            {dayMatches.map((m) => (
              <View key={m.id} style={styles.matchCard}>
                <Text style={styles.matchMeta}>
                  {roundLabel(m.round)}{m.group_id ? ` · Group ${m.group_id}` : ""}  ·  {formatKickoff(new Date(m.kickoff))}
                </Text>
                <Text style={styles.matchTeams}>
                  {teamLabel(m.home_team_code)} vs {teamLabel(m.away_team_code)}
                </Text>
                {m.venue ? <Text style={styles.matchVenue}>{m.venue}</Text> : null}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  content: {
    padding: spacing.lg
  },
  dayHeader: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    textTransform: "uppercase"
  },
  daySection: {
    marginBottom: spacing.lg
  },
  errorText: {
    color: "rgba(255, 248, 234, 0.7)",
    fontSize: 14,
    paddingHorizontal: spacing.lg,
    textAlign: "center"
  },
  matchCard: {
    backgroundColor: "rgba(255, 248, 234, 0.06)",
    borderColor: "rgba(255, 248, 234, 0.12)",
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  matchMeta: {
    color: "rgba(255, 248, 234, 0.6)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6
  },
  matchTeams: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4
  },
  matchVenue: {
    color: "rgba(255, 248, 234, 0.55)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  root: {
    backgroundColor: colors.pitch,
    flex: 1
  },
  subtitle: {
    color: "rgba(255, 248, 234, 0.7)",
    marginBottom: spacing.lg,
    ...typography.body
  },
  title: {
    color: colors.cream,
    ...typography.display
  }
});
