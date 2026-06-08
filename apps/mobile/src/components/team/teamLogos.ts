import { SUPPORTED_NATIONS } from "@world-cup-game/config";
import type { ImageSourcePropType } from "react-native";

export const TEAM_LOGO_SOURCES: Record<string, ImageSourcePropType> = {
  ALG: require("../../../assets/team-logos/ALG.png"),
  ARG: require("../../../assets/team-logos/ARG.png"),
  AUS: require("../../../assets/team-logos/AUS.png"),
  AUT: require("../../../assets/team-logos/AUT.png"),
  BEL: require("../../../assets/team-logos/BEL.png"),
  BIH: require("../../../assets/team-logos/BIH.png"),
  BRA: require("../../../assets/team-logos/BRA.png"),
  CAN: require("../../../assets/team-logos/CAN.png"),
  CIV: require("../../../assets/team-logos/CIV.png"),
  COD: require("../../../assets/team-logos/COD.png"),
  COL: require("../../../assets/team-logos/COL.png"),
  CPV: require("../../../assets/team-logos/CPV.png"),
  CRO: require("../../../assets/team-logos/CRO.png"),
  CUW: require("../../../assets/team-logos/CUW.png"),
  CZE: require("../../../assets/team-logos/CZE.png"),
  ECU: require("../../../assets/team-logos/ECU.png"),
  EGY: require("../../../assets/team-logos/EGY.png"),
  ENG: require("../../../assets/team-logos/ENG.png"),
  ESP: require("../../../assets/team-logos/ESP.png"),
  FRA: require("../../../assets/team-logos/FRA.png"),
  GER: require("../../../assets/team-logos/GER.png"),
  GHA: require("../../../assets/team-logos/GHA.png"),
  HAI: require("../../../assets/team-logos/HAI.png"),
  IRN: require("../../../assets/team-logos/IRN.png"),
  IRQ: require("../../../assets/team-logos/IRQ.png"),
  JOR: require("../../../assets/team-logos/JOR.png"),
  JPN: require("../../../assets/team-logos/JPN.png"),
  KOR: require("../../../assets/team-logos/KOR.png"),
  KSA: require("../../../assets/team-logos/KSA.png"),
  MAR: require("../../../assets/team-logos/MAR.png"),
  MEX: require("../../../assets/team-logos/MEX.png"),
  NED: require("../../../assets/team-logos/NED.png"),
  NOR: require("../../../assets/team-logos/NOR.png"),
  NZL: require("../../../assets/team-logos/NZL.png"),
  PAN: require("../../../assets/team-logos/PAN.png"),
  PAR: require("../../../assets/team-logos/PAR.png"),
  POR: require("../../../assets/team-logos/POR.png"),
  QAT: require("../../../assets/team-logos/QAT.png"),
  RSA: require("../../../assets/team-logos/RSA.png"),
  SCO: require("../../../assets/team-logos/SCO.png"),
  SEN: require("../../../assets/team-logos/SEN.png"),
  SUI: require("../../../assets/team-logos/SUI.png"),
  SWE: require("../../../assets/team-logos/SWE.png"),
  TUN: require("../../../assets/team-logos/TUN.png"),
  TUR: require("../../../assets/team-logos/TUR.png"),
  URU: require("../../../assets/team-logos/URU.png"),
  USA: require("../../../assets/team-logos/USA.png"),
  UZB: require("../../../assets/team-logos/UZB.png"),
};

export function teamLogoSourceForCode(code: string | null | undefined) {
  if (!code) return undefined;
  return TEAM_LOGO_SOURCES[code.toUpperCase()];
}

export function teamLogoSourceForName(name: string | null | undefined) {
  if (!name) return undefined;
  const nation = SUPPORTED_NATIONS.find((candidate) => candidate.name === name);
  return teamLogoSourceForCode(nation?.code);
}
