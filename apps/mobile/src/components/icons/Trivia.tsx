import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgTrivia = (props: SvgProps) => (
  <Svg
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    {...props}
  >
    <Path d="M4 5.5c0-1.1.9-1.9 2-1.9l12 .1c1.1 0 2 .8 2 1.9v8.8c0 1.1-.9 1.9-2 1.9H9.5l-3.9 3.5.1-3.5c-1-.1-1.7-.9-1.7-1.9Z" />
    <Path d="M9.4 7.6c.2-1.1 1.2-1.7 2.5-1.6 1.4.1 2.3.9 2.2 2.1-.1 1.3-1.2 1.6-1.9 2.3-.4.4-.4.9-.4 1.4M11.7 13.7v.1" />
  </Svg>
);
export default SvgTrivia;
