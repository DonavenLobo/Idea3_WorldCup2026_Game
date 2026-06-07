import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { opacity } from "../../../theme/colors";

export function BlurredSheetBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={Platform.OS === "ios" ? 1 : 0.55}
      pressBehavior="close"
      style={[props.style, styles.backdrop]}
    >
      {Platform.OS === "ios" ? (
        <BlurView intensity={48} style={StyleSheet.absoluteFill} tint="light" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.scrim]} />
      )}
    </BottomSheetBackdrop>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: "transparent",
  },
  scrim: {
    backgroundColor: opacity.ink70,
  },
});
