export interface NationConfig {
  code: string;
  name: string;
  flagEmoji: string;
  confederation?: string;
  primaryColor: string;
  secondaryColor: string;
}

// Provisional best-effort 48-nation list for development. This is NOT the
// final 2026 tournament field. Replace with the official qualified nation
// list before launch. Distribution mirrors the expected 2026 allocation
// (UEFA 16, CAF 9, AFC 8, CONMEBOL 7, CONCACAF 7, OFC 1).
export const SUPPORTED_NATIONS: NationConfig[] = [
  // CONCACAF
  { code: "USA", name: "United States", flagEmoji: "🇺🇸", confederation: "CONCACAF", primaryColor: "#1F4E8C", secondaryColor: "#C8102E" },
  { code: "MEX", name: "Mexico", flagEmoji: "🇲🇽", confederation: "CONCACAF", primaryColor: "#006341", secondaryColor: "#CE1126" },
  { code: "CAN", name: "Canada", flagEmoji: "🇨🇦", confederation: "CONCACAF", primaryColor: "#D80621", secondaryColor: "#FFFFFF" },
  { code: "CRC", name: "Costa Rica", flagEmoji: "🇨🇷", confederation: "CONCACAF", primaryColor: "#002B7F", secondaryColor: "#CE1126" },
  { code: "PAN", name: "Panama", flagEmoji: "🇵🇦", confederation: "CONCACAF", primaryColor: "#005AA7", secondaryColor: "#DA121A" },
  { code: "JAM", name: "Jamaica", flagEmoji: "🇯🇲", confederation: "CONCACAF", primaryColor: "#009B3A", secondaryColor: "#FED100" },
  { code: "HON", name: "Honduras", flagEmoji: "🇭🇳", confederation: "CONCACAF", primaryColor: "#0073CF", secondaryColor: "#FFFFFF" },
  // CONMEBOL
  { code: "BRA", name: "Brazil", flagEmoji: "🇧🇷", confederation: "CONMEBOL", primaryColor: "#009B3A", secondaryColor: "#FFDF00" },
  { code: "ARG", name: "Argentina", flagEmoji: "🇦🇷", confederation: "CONMEBOL", primaryColor: "#75AADB", secondaryColor: "#F6B40E" },
  { code: "URU", name: "Uruguay", flagEmoji: "🇺🇾", confederation: "CONMEBOL", primaryColor: "#5CBFEB", secondaryColor: "#FCD116" },
  { code: "COL", name: "Colombia", flagEmoji: "🇨🇴", confederation: "CONMEBOL", primaryColor: "#FCD116", secondaryColor: "#003893" },
  { code: "ECU", name: "Ecuador", flagEmoji: "🇪🇨", confederation: "CONMEBOL", primaryColor: "#FFD100", secondaryColor: "#034EA2" },
  { code: "PER", name: "Peru", flagEmoji: "🇵🇪", confederation: "CONMEBOL", primaryColor: "#D91023", secondaryColor: "#FFFFFF" },
  { code: "PAR", name: "Paraguay", flagEmoji: "🇵🇾", confederation: "CONMEBOL", primaryColor: "#D52B1E", secondaryColor: "#0038A8" },
  // UEFA
  { code: "ENG", name: "England", flagEmoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", confederation: "UEFA", primaryColor: "#FFFFFF", secondaryColor: "#C8102E" },
  { code: "FRA", name: "France", flagEmoji: "🇫🇷", confederation: "UEFA", primaryColor: "#1D3F8F", secondaryColor: "#EF4135" },
  { code: "ESP", name: "Spain", flagEmoji: "🇪🇸", confederation: "UEFA", primaryColor: "#C60B1E", secondaryColor: "#FFC400" },
  { code: "GER", name: "Germany", flagEmoji: "🇩🇪", confederation: "UEFA", primaryColor: "#000000", secondaryColor: "#DD0000" },
  { code: "POR", name: "Portugal", flagEmoji: "🇵🇹", confederation: "UEFA", primaryColor: "#006600", secondaryColor: "#FF0000" },
  { code: "NED", name: "Netherlands", flagEmoji: "🇳🇱", confederation: "UEFA", primaryColor: "#FF6C00", secondaryColor: "#21468B" },
  { code: "BEL", name: "Belgium", flagEmoji: "🇧🇪", confederation: "UEFA", primaryColor: "#000000", secondaryColor: "#FDDA24" },
  { code: "ITA", name: "Italy", flagEmoji: "🇮🇹", confederation: "UEFA", primaryColor: "#0066CC", secondaryColor: "#FFFFFF" },
  { code: "CRO", name: "Croatia", flagEmoji: "🇭🇷", confederation: "UEFA", primaryColor: "#FF0000", secondaryColor: "#FFFFFF" },
  { code: "SUI", name: "Switzerland", flagEmoji: "🇨🇭", confederation: "UEFA", primaryColor: "#FF0000", secondaryColor: "#FFFFFF" },
  { code: "DEN", name: "Denmark", flagEmoji: "🇩🇰", confederation: "UEFA", primaryColor: "#C8102E", secondaryColor: "#FFFFFF" },
  { code: "POL", name: "Poland", flagEmoji: "🇵🇱", confederation: "UEFA", primaryColor: "#DC143C", secondaryColor: "#FFFFFF" },
  { code: "NOR", name: "Norway", flagEmoji: "🇳🇴", confederation: "UEFA", primaryColor: "#BA0C2F", secondaryColor: "#00205B" },
  { code: "SWE", name: "Sweden", flagEmoji: "🇸🇪", confederation: "UEFA", primaryColor: "#006AA7", secondaryColor: "#FECC00" },
  { code: "AUT", name: "Austria", flagEmoji: "🇦🇹", confederation: "UEFA", primaryColor: "#ED2939", secondaryColor: "#FFFFFF" },
  { code: "SRB", name: "Serbia", flagEmoji: "🇷🇸", confederation: "UEFA", primaryColor: "#C6363C", secondaryColor: "#0C4076" },
  // AFC
  { code: "JPN", name: "Japan", flagEmoji: "🇯🇵", confederation: "AFC", primaryColor: "#BC002D", secondaryColor: "#FFFFFF" },
  { code: "KOR", name: "South Korea", flagEmoji: "🇰🇷", confederation: "AFC", primaryColor: "#003478", secondaryColor: "#C60C30" },
  { code: "AUS", name: "Australia", flagEmoji: "🇦🇺", confederation: "AFC", primaryColor: "#00843D", secondaryColor: "#FFCD00" },
  { code: "IRN", name: "Iran", flagEmoji: "🇮🇷", confederation: "AFC", primaryColor: "#239F40", secondaryColor: "#DA0000" },
  { code: "KSA", name: "Saudi Arabia", flagEmoji: "🇸🇦", confederation: "AFC", primaryColor: "#006C35", secondaryColor: "#FFFFFF" },
  { code: "QAT", name: "Qatar", flagEmoji: "🇶🇦", confederation: "AFC", primaryColor: "#8A1538", secondaryColor: "#FFFFFF" },
  { code: "UZB", name: "Uzbekistan", flagEmoji: "🇺🇿", confederation: "AFC", primaryColor: "#0099B5", secondaryColor: "#1EB53A" },
  { code: "IRQ", name: "Iraq", flagEmoji: "🇮🇶", confederation: "AFC", primaryColor: "#CE1126", secondaryColor: "#007A3D" },
  // CAF
  { code: "MAR", name: "Morocco", flagEmoji: "🇲🇦", confederation: "CAF", primaryColor: "#C1272D", secondaryColor: "#006233" },
  { code: "SEN", name: "Senegal", flagEmoji: "🇸🇳", confederation: "CAF", primaryColor: "#00853F", secondaryColor: "#FDEF42" },
  { code: "EGY", name: "Egypt", flagEmoji: "🇪🇬", confederation: "CAF", primaryColor: "#CE1126", secondaryColor: "#000000" },
  { code: "NGA", name: "Nigeria", flagEmoji: "🇳🇬", confederation: "CAF", primaryColor: "#008751", secondaryColor: "#FFFFFF" },
  { code: "CMR", name: "Cameroon", flagEmoji: "🇨🇲", confederation: "CAF", primaryColor: "#007A3D", secondaryColor: "#CE1126" },
  { code: "GHA", name: "Ghana", flagEmoji: "🇬🇭", confederation: "CAF", primaryColor: "#CE1126", secondaryColor: "#FCD116" },
  { code: "TUN", name: "Tunisia", flagEmoji: "🇹🇳", confederation: "CAF", primaryColor: "#E70013", secondaryColor: "#FFFFFF" },
  { code: "ALG", name: "Algeria", flagEmoji: "🇩🇿", confederation: "CAF", primaryColor: "#006233", secondaryColor: "#FFFFFF" },
  { code: "CIV", name: "Ivory Coast", flagEmoji: "🇨🇮", confederation: "CAF", primaryColor: "#F77F00", secondaryColor: "#009E60" },
  // OFC
  { code: "NZL", name: "New Zealand", flagEmoji: "🇳🇿", confederation: "OFC", primaryColor: "#0033A0", secondaryColor: "#FFFFFF" }
];
