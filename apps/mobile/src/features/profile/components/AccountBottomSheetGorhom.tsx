import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { Dimensions } from "react-native";
import { APP_ROUTES } from "@world-cup-game/config";
import {
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetModal as BottomSheetModalType,
} from "@gorhom/bottom-sheet";
import { triggerLightImpact } from "../../../lib/haptics";
import { colors, opacity } from "../../../theme/colors";
import { radius } from "../../../theme/radius";
import { spacing } from "../../../theme/spacing";
import { useAccountSheetActions } from "../hooks/useAccountSheetActions";
import type {
  AccountBottomSheetHandle,
  AccountBottomSheetProps,
} from "./accountBottomSheetTypes";
import { AccountMenuContent } from "./AccountMenuContent";
import { BlurredSheetBackdrop } from "./BlurredSheetBackdrop";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export const AccountBottomSheetGorhom = forwardRef<
  AccountBottomSheetHandle,
  AccountBottomSheetProps
>(function AccountBottomSheetGorhom(
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
  const sheetRef = useRef<BottomSheetModalType>(null);
  const { handleDismiss, queueNavigation, queueSignOut, resetPending } =
    useAccountSheetActions(onOpenChange);

  const dismissSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      present: () => {
        triggerLightImpact();
        resetPending();
        sheetRef.current?.present();
        onOpenChange?.(true);
      },
      dismiss: dismissSheet,
    }),
    [dismissSheet, onOpenChange, resetPending]
  );

  const handleOpenCard = useCallback(() => {
    queueNavigation(APP_ROUTES.tabs.card);
    dismissSheet();
  }, [dismissSheet, queueNavigation]);

  const handleOpenLeaderboard = useCallback(() => {
    queueNavigation("/leaderboard");
    dismissSheet();
  }, [dismissSheet, queueNavigation]);

  const handleOpenLockerRoom = useCallback(() => {
    queueNavigation(APP_ROUTES.tabs.lockerRoom);
    dismissSheet();
  }, [dismissSheet, queueNavigation]);

  const handleRequestSignOut = useCallback(() => {
    queueSignOut();
    dismissSheet();
  }, [dismissSheet, queueSignOut]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => <BlurredSheetBackdrop {...props} />,
    []
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      enableDynamicSizing
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
      maxDynamicContentSize={SCREEN_HEIGHT * 0.85}
      onDismiss={handleDismiss}
    >
      <BottomSheetScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <AccountMenuContent
          creditBalance={creditBalance}
          leaderboardScore={leaderboardScore}
          displayName={displayName}
          email={email}
          imageUri={imageUri}
          nationCode={nationCode}
          overall={overall}
          onDone={dismissSheet}
          onOpenCard={handleOpenCard}
          onOpenLeaderboard={handleOpenLeaderboard}
          onOpenLockerRoom={handleOpenLockerRoom}
          onRequestSignOut={handleRequestSignOut}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = {
  handleIndicator: {
    backgroundColor: opacity.ink15,
    marginTop: spacing.sm,
    width: 40,
  },
  sheetBackground: {
    backgroundColor: colors.cream,
    borderColor: opacity.ink10,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 2,
  },
} as const;
