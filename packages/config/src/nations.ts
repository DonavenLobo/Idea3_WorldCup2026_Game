export interface NationConfig {
  code: string;
  name: string;
  flagEmoji: string;
  confederation?: string;
  primaryColor: string;
  secondaryColor: string;
}

// Starter seed list only. Replace with the official qualified nation list before launch.
export const SUPPORTED_NATIONS: NationConfig[] = [
  {
    code: "USA",
    name: "United States",
    flagEmoji: "🇺🇸",
    confederation: "CONCACAF",
    primaryColor: "#1F4E8C",
    secondaryColor: "#C8102E"
  },
  {
    code: "MEX",
    name: "Mexico",
    flagEmoji: "🇲🇽",
    confederation: "CONCACAF",
    primaryColor: "#006341",
    secondaryColor: "#CE1126"
  },
  {
    code: "CAN",
    name: "Canada",
    flagEmoji: "🇨🇦",
    confederation: "CONCACAF",
    primaryColor: "#D80621",
    secondaryColor: "#FFFFFF"
  },
  {
    code: "BRA",
    name: "Brazil",
    flagEmoji: "🇧🇷",
    confederation: "CONMEBOL",
    primaryColor: "#009B3A",
    secondaryColor: "#FFDF00"
  },
  {
    code: "ARG",
    name: "Argentina",
    flagEmoji: "🇦🇷",
    confederation: "CONMEBOL",
    primaryColor: "#75AADB",
    secondaryColor: "#F6B40E"
  },
  {
    code: "ENG",
    name: "England",
    flagEmoji: "🏴",
    confederation: "UEFA",
    primaryColor: "#FFFFFF",
    secondaryColor: "#C8102E"
  },
  {
    code: "FRA",
    name: "France",
    flagEmoji: "🇫🇷",
    confederation: "UEFA",
    primaryColor: "#1D3F8F",
    secondaryColor: "#EF4135"
  }
];
