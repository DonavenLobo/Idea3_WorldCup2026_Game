import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { Modal, StyleSheet } from "react-native";
import { APP_ROUTES } from "@gogaffa/config";
import { SafeAreaView } from "react-native-safe-area-context";
import { triggerLightImpact } from "../../../lib/haptics";
import { colors } from "../../../theme/colors";
import { useAccountSheetActions } from "../hooks/useAccountSheetActions";
import type {
  AccountBottomSheetHandle,
  AccountBottomSheetProps,
} from "./accountBottomSheetTypes";
import { AccountMenuContent } from "./AccountMenuContent";

export const AccountBottomSheetFallback = forwardRef<
  AccountBottomSheetHandle,
  AccountBottomSheetProps
>(function AccountBottomSheetFallback(
  {
    creditBalance,
    leaderboardScore,
    displayName,
    email,
    imageUri,
    nationCode,
    overall,
    onOpenChange,
  },
  ref
) {
  const [visible, setVisible] = useState(false);
  const { handleDismiss, queueNavigation, queueSignOut, queueDeleteAccount, resetPending } =
    useAccountSheetActions(onOpenChange);

  const closeAndFinalize = useCallback(() => {
    setVisible(false);
    handleDismiss();
  }, [handleDismiss]);

  useImperativeHandle(
    ref,
    () => ({
      present: () => {
        triggerLightImpact();
        resetPending();
        setVisible(true);
        onOpenChange?.(true);
      },
      dismiss: () => {
        setVisible(false);
      },
    }),
    [onOpenChange, resetPending]
  );

  const handleOpenCard = useCallback(() => {
    queueNavigation(APP_ROUTES.tabs.card);
    closeAndFinalize();
  }, [closeAndFinalize, queueNavigation]);

  const handleOpenLeaderboard = useCallback(() => {
    queueNavigation("/leaderboard");
    closeAndFinalize();
  }, [closeAndFinalize, queueNavigation]);

  const handleOpenLockerRoom = useCallback(() => {
    queueNavigation(APP_ROUTES.tabs.lockerRoom);
    closeAndFinalize();
  }, [closeAndFinalize, queueNavigation]);

  const handleRequestSignOut = useCallback(() => {
    queueSignOut();
    closeAndFinalize();
  }, [closeAndFinalize, queueSignOut]);

  const handleRequestDeleteAccount = useCallback(() => {
    queueDeleteAccount();
    closeAndFinalize();
  }, [closeAndFinalize, queueDeleteAccount]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeAndFinalize}
    >
      <SafeAreaView edges={["top", "bottom"]} style={styles.root}>
        <AccountMenuContent
          creditBalance={creditBalance}
          leaderboardScore={leaderboardScore}
          displayName={displayName}
          email={email}
          imageUri={imageUri}
          nationCode={nationCode}
          overall={overall}
          onDone={closeAndFinalize}
          onOpenCard={handleOpenCard}
          onOpenLeaderboard={handleOpenLeaderboard}
          onOpenLockerRoom={handleOpenLockerRoom}
          onRequestSignOut={handleRequestSignOut}
          onRequestDeleteAccount={handleRequestDeleteAccount}
        />
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.cream,
    flex: 1,
  },
});
