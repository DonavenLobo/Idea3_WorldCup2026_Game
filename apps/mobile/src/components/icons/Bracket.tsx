import * as React from "react";
import Svg, { Path } from "react-native-svg";
import type { SvgProps } from "react-native-svg";
const SvgBracket = (props: SvgProps) => (
  <Svg
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    viewBox="0 0 24 24"
    {...props}
  >
    <Path d="M3.5 5H7M3.5 9H7M3.5 15H7M3.5 19H7M7 5h2v4H7M7 15h2v4H7M9 7h3v10H9M12 12h8.5" />
  </Svg>
);
export default SvgBracket;
