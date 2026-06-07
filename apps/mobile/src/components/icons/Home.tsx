import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgHome = (props: SvgProps) => (
  <Svg
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    {...props}
  >
    <Path d="M3.5 11.2C7 8 10 5.4 12.1 3.9c2.1 1.7 5.2 4.2 8.5 7.1" />
    <Path d="m5.4 10 .2 9.4c0 .6.4.9 1 .9l10.7.1c.6 0 1-.4 1-1l-.1-9.5" />
    <Path d="m9.7 20.3-.1-6c0-.5.4-.8.9-.8l3.1.1c.5 0 .8.4.8.9v5.9" />
  </Svg>
);
export default SvgHome;
