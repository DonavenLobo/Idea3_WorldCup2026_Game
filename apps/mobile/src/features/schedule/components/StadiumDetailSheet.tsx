import { Alert, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { getStadiumByCity } from "@world-cup-game/config";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { mapsUrl } from "../utils";

interface StadiumDetailSheetProps {
  city: string | null;
  onClose: () => void;
}

export function StadiumDetailSheet({ city, onClose }: StadiumDetailSheetProps) {
  const stadium = city ? getStadiumByCity(city) : undefined;

  return (
    <Modal visible={city !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => undefined}>
          {stadium ? (
            <>
              <Text style={styles.name}>{stadium.name}</Text>
              <Text style={styles.city}>{stadium.city}</Text>
              <View style={styles.metaRow}>
                <Meta label="Capacity" value={stadium.capacity.toLocaleString()} />
                <Meta label="Local time" value={stadium.timezone} />
              </View>
              <Pressable
                style={styles.mapsButton}
                onPress={() =>
                  void Linking.openURL(mapsUrl(stadium.lat, stadium.lng)).catch(() =>
                    Alert.alert("Unable to open Maps")
                  )
                }
              >
                <Text style={styles.mapsLabel}>Open in Maps</Text>
              </Pressable>
            </>
          ) : (
            <Text style={styles.city}>Venue details unavailable.</Text>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "flex-end"
  },
  city: {
    color: opacity.ink60,
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  mapsButton: {
    alignItems: "center",
    backgroundColor: colors.red,
    borderRadius: radius.pill,
    marginTop: spacing.lg,
    paddingVertical: spacing.md
  },
  mapsLabel: {
    color: colors.cream,
    fontSize: 15,
    fontWeight: "700"
  },
  meta: {
    flex: 1
  },
  metaLabel: {
    color: opacity.ink55,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  metaRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg
  },
  metaValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2
  },
  name: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "700"
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl
  }
});
