import { useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { APP_ROUTES } from "@world-cup-game/config";
import { OnboardingShell } from "../../src/components/onboarding";
import { PhotoChoiceButton, useOnboarding } from "../../src/features/onboarding";
import { spacing } from "../../src/theme/spacing";

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
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (asset) {
      setPhotoSource({
        base64: asset.base64 ?? undefined,
        type: "selfie",
        uri: asset.uri,
      });
      goToCreateCard();
    }
  };

  const uploadPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      base64: true,
      quality: 0.7,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (asset) {
      setPhotoSource({
        base64: asset.base64 ?? undefined,
        type: "upload",
        uri: asset.uri,
      });
      goToCreateCard();
    }
  };

  const surpriseMe = () => {
    setPhotoSource({ type: "random" });
    goToCreateCard();
  };

  return (
    <OnboardingShell
      step={2}
      showBack
      title="Create your avatar"
      subtitle="Choose how your footballer gets sketched"
    >
      <View style={styles.options}>
        <PhotoChoiceButton
          emoji="🤳"
          title="Take a Selfie"
          subtitle="We'll turn your selfie into an avatar in your team's kit."
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
          subtitle="Get an AI footballer who looks the part."
          onPress={surpriseMe}
        />
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  options: {
    marginTop: spacing.sm,
  },
});
