import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgGroups = (props: SvgProps) => (
  <Svg
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    {...props}
  >
    <Path d="M9 9c0-1.7-1.3-3-3-3S3 7.3 3 9s1.3 3 3 3 3-1.3 3-3M2 20c0-3.3 1.7-5.4 4-5.4s4 2.1 4 5.4M18.5 9c0-1.7-1.3-3-3-3s-3 1.3-3 3 1.3 3 3 3 3-1.3 3-3M11.5 20c0-3.3 1.7-5.4 4-5.4s4 2.1 4 5.4" />
  </Svg>
);
export default SvgGroups;
