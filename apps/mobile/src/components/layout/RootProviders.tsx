import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { isGestureHandlerAvailable } from "../../lib/nativeCapabilities";

interface RootProvidersProps {
  children: ReactNode;
}

export function RootProviders({ children }: RootProvidersProps) {
  if (!isGestureHandlerAvailable()) {
    return <View style={styles.root}>{children}</View>;
  }

  require("react-native-gesture-handler");

  const { GestureHandlerRootView } = require("react-native-gesture-handler") as typeof import("react-native-gesture-handler");
  const { BottomSheetModalProvider } = require("@gorhom/bottom-sheet") as typeof import("@gorhom/bottom-sheet");

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
