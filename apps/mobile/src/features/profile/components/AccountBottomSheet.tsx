import { isGestureHandlerAvailable } from "../../../lib/nativeCapabilities";
import type {
  AccountBottomSheetHandle,
  AccountBottomSheetProps,
} from "./accountBottomSheetTypes";

export type { AccountBottomSheetHandle, AccountBottomSheetProps };

export const AccountBottomSheet = isGestureHandlerAvailable()
  ? require("./AccountBottomSheetGorhom").AccountBottomSheetGorhom
  : require("./AccountBottomSheetFallback").AccountBottomSheetFallback;
