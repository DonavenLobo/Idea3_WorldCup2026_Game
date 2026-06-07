import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgCard = (props: SvgProps) => (
  <Svg
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    {...props}
  >
    <Path d="m5.4 3.6 10.1.1L19 7.2l-.1 12.4c0 .6-.4.9-1 .9l-12.3-.1c-.6 0-1-.4-1-.9l-.1-15c0-.5.4-.9.9-.9" />
    <Path d="M15.4 3.8v2.9c0 .5.4.8.9.8l2.6-.1M7.4 12.5l7.4.1M7.4 15.6h5" />
  </Svg>
);
export default SvgCard;
