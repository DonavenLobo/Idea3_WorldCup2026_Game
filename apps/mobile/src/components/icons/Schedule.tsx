import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgSchedule = (props: SvgProps) => (
  <Svg
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    {...props}
  >
    <Path d="M5 6.4c0-.6.4-1 1-1l12 .1c.6 0 1 .4 1 1l-.1 12.1c0 .6-.4 1-1 1l-12-.1c-.6 0-1-.4-1-1ZM5 9.6l14 .1M8.4 3.6V7M15.6 3.7v3.4M8.2 13h.1M12 13.1h.1M8.2 16.2h.1" />
  </Svg>
);
export default SvgSchedule;
