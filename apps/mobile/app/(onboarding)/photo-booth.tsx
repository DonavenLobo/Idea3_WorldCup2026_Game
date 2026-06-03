import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { APP_ROUTES } from "@world-cup-game/config";
import { PhotoChoiceButton, useOnboarding } from "../../src/features/onboarding";
import { BackButton } from "../../src/components/common/BackButton";
import { colors } from "../../src/theme/colors";
import { spacing } from "../../src/theme/spacing";
import { typography } from "../../src/theme/typography";

export default function PhotoBoothScreen() {
  const router = useRouter();
  const { setPhotoSource } = useOnboarding();

  const goToCreateCard = () => router.push(APP_ROUTES.onboarding.createCard);

  const takeSelfie = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Camera access needed",
        "Enable camera access in Settings to take a selfie."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      base64: true,
      quality: 0.7
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (asset) {
      setPhotoSource({
        base64: asset.base64 ?? undefined,
        type: "selfie",
        uri: asset.uri
      });
      goToCreateCard();
    }
  };

  const uploadPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      base64: true,
      quality: 0.7
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (asset) {
      setPhotoSource({
        base64: asset.base64 ?? undefined,
        type: "upload",
        uri: asset.uri
      });
      goToCreateCard();
    }
  };

  const surpriseMe = () => {
    setPhotoSource({ type: "random" });
    goToCreateCard();
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton variant="dark" />
        <Text style={styles.eyebrow}>Step 2 of 3</Text>
        <Text style={styles.tagline}>Create your avatar</Text>
        <Text style={styles.title}>Choose how your footballer avatar gets made</Text>

        <View style={styles.options}>
          <PhotoChoiceButton
            emoji="🤳"
            title="Take a Selfie"
            subtitle="We will turn your selfie into an avatar in your team's kit."
            onPress={takeSelfie}
          />
          <PhotoChoiceButton
            emoji="🖼️"
            title="Upload a Photo"
            subtitle="Use your own photo, restyled in your team's kit."
            onPress={uploadPhoto}
          />
          <PhotoChoiceButton
            emoji="🎲"
            title="Surprise Me"
            subtitle="Get an AI footballer who looks the part, in your team's kit."
            onPress={surpriseMe}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  options: {
    marginTop: spacing.xl
  },
  root: {
    backgroundColor: colors.cream,
    flex: 1
  },
  tagline: {
    color: "rgba(12, 59, 46, 0.75)",
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  title: {
    color: colors.pitch,
    marginTop: spacing.xs,
    ...typography.display
  }
});
