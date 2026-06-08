import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { StyleSheet } from "react-native";
import { opacity } from "../../../theme/colors";

export function BlurredSheetBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.55}
      pressBehavior="close"
      style={[props.style, styles.backdrop]}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: opacity.ink70,
  },
});
