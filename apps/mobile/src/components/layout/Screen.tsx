import { forwardRef, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  scrollProps?: Omit<ScrollViewProps, "children" | "contentContainerStyle" | "style" | "ref">;
  bottomInset?: number;
}

export const Screen = forwardRef<ScrollView, ScreenProps>(function Screen(
  {
    children,
    scroll = true,
    keyboard = false,
    edges = ["top", "bottom"],
    contentContainerStyle,
    style,
    scrollProps,
    bottomInset = spacing.lg,
  },
  ref
) {
  const insets = useSafeAreaInsets();
  const paddingBottom = insets.bottom + bottomInset;

  const contentStyle = [
    styles.content,
    { paddingBottom },
    contentContainerStyle,
  ];

  const body = scroll ? (
    <ScrollView
      ref={ref}
      style={styles.scroll}
      contentContainerStyle={contentStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { paddingBottom }, contentContainerStyle]}>{children}</View>
  );

  const wrapped = keyboard ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );

  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      {wrapped}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  flex: {
    flex: 1,
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
});
