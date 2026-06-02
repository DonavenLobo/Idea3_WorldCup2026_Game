import * as Linking from "expo-linking";
import { StyleSheet, Text } from "react-native";
import {
  PRIVACY_POLICY_URL,
  SUPPORT_URL,
  TERMS_OF_SERVICE_URL
} from "../../../lib/constants";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

function openUrl(url: string) {
  void Linking.openURL(url);
}

export function AuthLegalLinks() {
  return (
    <Text style={styles.text}>
      By continuing, you agree to GoGaffa&apos;s{" "}
      <Text style={styles.link} onPress={() => openUrl(TERMS_OF_SERVICE_URL)}>
        Terms
      </Text>{" "}
      and{" "}
      <Text style={styles.link} onPress={() => openUrl(PRIVACY_POLICY_URL)}>
        Privacy Policy
      </Text>
      . Need help?{" "}
      <Text style={styles.link} onPress={() => openUrl(SUPPORT_URL)}>
        Contact support
      </Text>
      .
    </Text>
  );
}

const styles = StyleSheet.create({
  link: {
    color: colors.pitch,
    fontWeight: "900",
    textDecorationLine: "underline"
  },
  text: {
    color: "rgba(12, 59, 46, 0.65)",
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
    textAlign: "center"
  }
});
