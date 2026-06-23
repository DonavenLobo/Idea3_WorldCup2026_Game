import { SUPPORTED_NATIONS } from "@gogaffa/config";
import type { FC } from "react";
import type { SvgProps } from "react-native-svg";

import ALG from "../../../assets/flags/ALG.svg";
import ARG from "../../../assets/flags/ARG.svg";
import AUS from "../../../assets/flags/AUS.svg";
import AUT from "../../../assets/flags/AUT.svg";
import BEL from "../../../assets/flags/BEL.svg";
import BIH from "../../../assets/flags/BIH.svg";
import BRA from "../../../assets/flags/BRA.svg";
import CAN from "../../../assets/flags/CAN.svg";
import CIV from "../../../assets/flags/CIV.svg";
import COD from "../../../assets/flags/COD.svg";
import COL from "../../../assets/flags/COL.svg";
import CPV from "../../../assets/flags/CPV.svg";
import CRO from "../../../assets/flags/CRO.svg";
import CUW from "../../../assets/flags/CUW.svg";
import CZE from "../../../assets/flags/CZE.svg";
import ECU from "../../../assets/flags/ECU.svg";
import EGY from "../../../assets/flags/EGY.svg";
import ENG from "../../../assets/flags/ENG.svg";
import ESP from "../../../assets/flags/ESP.svg";
import FRA from "../../../assets/flags/FRA.svg";
import GER from "../../../assets/flags/GER.svg";
import GHA from "../../../assets/flags/GHA.svg";
import HAI from "../../../assets/flags/HAI.svg";
import IRN from "../../../assets/flags/IRN.svg";
import IRQ from "../../../assets/flags/IRQ.svg";
import JOR from "../../../assets/flags/JOR.svg";
import JPN from "../../../assets/flags/JPN.svg";
import KOR from "../../../assets/flags/KOR.svg";
import KSA from "../../../assets/flags/KSA.svg";
import MAR from "../../../assets/flags/MAR.svg";
import MEX from "../../../assets/flags/MEX.svg";
import NED from "../../../assets/flags/NED.svg";
import NOR from "../../../assets/flags/NOR.svg";
import NZL from "../../../assets/flags/NZL.svg";
import PAN from "../../../assets/flags/PAN.svg";
import PAR from "../../../assets/flags/PAR.svg";
import POR from "../../../assets/flags/POR.svg";
import QAT from "../../../assets/flags/QAT.svg";
import RSA from "../../../assets/flags/RSA.svg";
import SCO from "../../../assets/flags/SCO.svg";
import SEN from "../../../assets/flags/SEN.svg";
import SUI from "../../../assets/flags/SUI.svg";
import SWE from "../../../assets/flags/SWE.svg";
import TUN from "../../../assets/flags/TUN.svg";
import TUR from "../../../assets/flags/TUR.svg";
import URU from "../../../assets/flags/URU.svg";
import USA from "../../../assets/flags/USA.svg";
import UZB from "../../../assets/flags/UZB.svg";

export type TeamFlagComponent = FC<SvgProps>;

export const TEAM_FLAG_COMPONENTS: Record<string, TeamFlagComponent> = {
  ALG,
  ARG,
  AUS,
  AUT,
  BEL,
  BIH,
  BRA,
  CAN,
  CIV,
  COD,
  COL,
  CPV,
  CRO,
  CUW,
  CZE,
  ECU,
  EGY,
  ENG,
  ESP,
  FRA,
  GER,
  GHA,
  HAI,
  IRN,
  IRQ,
  JOR,
  JPN,
  KOR,
  KSA,
  MAR,
  MEX,
  NED,
  NOR,
  NZL,
  PAN,
  PAR,
  POR,
  QAT,
  RSA,
  SCO,
  SEN,
  SUI,
  SWE,
  TUN,
  TUR,
  URU,
  USA,
  UZB,
};

export function teamFlagForCode(code: string | null | undefined) {
  if (!code) return undefined;
  return TEAM_FLAG_COMPONENTS[code.toUpperCase()];
}

export function teamFlagForName(name: string | null | undefined) {
  if (!name) return undefined;
  const nation = SUPPORTED_NATIONS.find((candidate) => candidate.name === name);
  return teamFlagForCode(nation?.code);
}
