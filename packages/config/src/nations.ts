export interface NationConfig {
  code: string;
  name: string;
  flagEmoji: string;
  confederation?: string;
  primaryColor: string;
  secondaryColor: string;
}

// Tournament teams derived from packages/config/src/data/worldcup.json.
// Keep these names aligned with fixture team names so onboarding, schedule
// filtering, brackets, leaderboards, and card rendering all resolve the same
// team metadata.
export const SUPPORTED_NATIONS: NationConfig[] = [
  // CONCACAF
  { code: "USA", name: "USA", flagEmoji: "🇺🇸", confederation: "CONCACAF", primaryColor: "#1F4E8C", secondaryColor: "#C8102E" },
  { code: "MEX", name: "Mexico", flagEmoji: "🇲🇽", confederation: "CONCACAF", primaryColor: "#006341", secondaryColor: "#CE1126" },
  { code: "CAN", name: "Canada", flagEmoji: "🇨🇦", confederation: "CONCACAF", primaryColor: "#D80621", secondaryColor: "#FFFFFF" },
  { code: "PAN", name: "Panama", flagEmoji: "🇵🇦", confederation: "CONCACAF", primaryColor: "#005AA7", secondaryColor: "#DA121A" },
  { code: "HAI", name: "Haiti", flagEmoji: "🇭🇹", confederation: "CONCACAF", primaryColor: "#00209F", secondaryColor: "#D21034" },
  { code: "CUW", name: "Curaçao", flagEmoji: "🇨🇼", confederation: "CONCACAF", primaryColor: "#002B7F", secondaryColor: "#F9E814" },
  // CONMEBOL
  { code: "BRA", name: "Brazil", flagEmoji: "🇧🇷", confederation: "CONMEBOL", primaryColor: "#009B3A", secondaryColor: "#FFDF00" },
  { code: "ARG", name: "Argentina", flagEmoji: "🇦🇷", confederation: "CONMEBOL", primaryColor: "#75AADB", secondaryColor: "#F6B40E" },
  { code: "URU", name: "Uruguay", flagEmoji: "🇺🇾", confederation: "CONMEBOL", primaryColor: "#5CBFEB", secondaryColor: "#FCD116" },
  { code: "COL", name: "Colombia", flagEmoji: "🇨🇴", confederation: "CONMEBOL", primaryColor: "#FCD116", secondaryColor: "#003893" },
  { code: "ECU", name: "Ecuador", flagEmoji: "🇪🇨", confederation: "CONMEBOL", primaryColor: "#FFD100", secondaryColor: "#034EA2" },
  { code: "PAR", name: "Paraguay", flagEmoji: "🇵🇾", confederation: "CONMEBOL", primaryColor: "#D52B1E", secondaryColor: "#0038A8" },
  // UEFA
  { code: "ENG", name: "England", flagEmoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}", confederation: "UEFA", primaryColor: "#FFFFFF", secondaryColor: "#C8102E" },
  { code: "FRA", name: "France", flagEmoji: "🇫🇷", confederation: "UEFA", primaryColor: "#1D3F8F", secondaryColor: "#EF4135" },
  { code: "ESP", name: "Spain", flagEmoji: "🇪🇸", confederation: "UEFA", primaryColor: "#C60B1E", secondaryColor: "#FFC400" },
  { code: "GER", name: "Germany", flagEmoji: "🇩🇪", confederation: "UEFA", primaryColor: "#000000", secondaryColor: "#DD0000" },
  { code: "POR", name: "Portugal", flagEmoji: "🇵🇹", confederation: "UEFA", primaryColor: "#006600", secondaryColor: "#FF0000" },
  { code: "NED", name: "Netherlands", flagEmoji: "🇳🇱", confederation: "UEFA", primaryColor: "#FF6C00", secondaryColor: "#21468B" },
  { code: "BEL", name: "Belgium", flagEmoji: "🇧🇪", confederation: "UEFA", primaryColor: "#000000", secondaryColor: "#FDDA24" },
  { code: "CRO", name: "Croatia", flagEmoji: "🇭🇷", confederation: "UEFA", primaryColor: "#FF0000", secondaryColor: "#FFFFFF" },
  { code: "SUI", name: "Switzerland", flagEmoji: "🇨🇭", confederation: "UEFA", primaryColor: "#FF0000", secondaryColor: "#FFFFFF" },
  { code: "NOR", name: "Norway", flagEmoji: "🇳🇴", confederation: "UEFA", primaryColor: "#BA0C2F", secondaryColor: "#00205B" },
  { code: "SWE", name: "Sweden", flagEmoji: "🇸🇪", confederation: "UEFA", primaryColor: "#006AA7", secondaryColor: "#FECC00" },
  { code: "AUT", name: "Austria", flagEmoji: "🇦🇹", confederation: "UEFA", primaryColor: "#ED2939", secondaryColor: "#FFFFFF" },
  { code: "BIH", name: "Bosnia & Herzegovina", flagEmoji: "🇧🇦", confederation: "UEFA", primaryColor: "#002395", secondaryColor: "#FECB00" },
  { code: "CZE", name: "Czech Republic", flagEmoji: "🇨🇿", confederation: "UEFA", primaryColor: "#D7141A", secondaryColor: "#11457E" },
  { code: "SCO", name: "Scotland", flagEmoji: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}", confederation: "UEFA", primaryColor: "#005EB8", secondaryColor: "#FFFFFF" },
  { code: "TUR", name: "Turkey", flagEmoji: "🇹🇷", confederation: "UEFA", primaryColor: "#E30A17", secondaryColor: "#FFFFFF" },
  // AFC
  { code: "JPN", name: "Japan", flagEmoji: "🇯🇵", confederation: "AFC", primaryColor: "#BC002D", secondaryColor: "#FFFFFF" },
  { code: "KOR", name: "South Korea", flagEmoji: "🇰🇷", confederation: "AFC", primaryColor: "#003478", secondaryColor: "#C60C30" },
  { code: "AUS", name: "Australia", flagEmoji: "🇦🇺", confederation: "AFC", primaryColor: "#00843D", secondaryColor: "#FFCD00" },
  { code: "IRN", name: "Iran", flagEmoji: "🇮🇷", confederation: "AFC", primaryColor: "#239F40", secondaryColor: "#DA0000" },
  { code: "KSA", name: "Saudi Arabia", flagEmoji: "🇸🇦", confederation: "AFC", primaryColor: "#006C35", secondaryColor: "#FFFFFF" },
  { code: "QAT", name: "Qatar", flagEmoji: "🇶🇦", confederation: "AFC", primaryColor: "#8A1538", secondaryColor: "#FFFFFF" },
  { code: "UZB", name: "Uzbekistan", flagEmoji: "🇺🇿", confederation: "AFC", primaryColor: "#0099B5", secondaryColor: "#1EB53A" },
  { code: "IRQ", name: "Iraq", flagEmoji: "🇮🇶", confederation: "AFC", primaryColor: "#CE1126", secondaryColor: "#007A3D" },
  { code: "JOR", name: "Jordan", flagEmoji: "🇯🇴", confederation: "AFC", primaryColor: "#CE1126", secondaryColor: "#007A3D" },
  // CAF
  { code: "MAR", name: "Morocco", flagEmoji: "🇲🇦", confederation: "CAF", primaryColor: "#C1272D", secondaryColor: "#006233" },
  { code: "SEN", name: "Senegal", flagEmoji: "🇸🇳", confederation: "CAF", primaryColor: "#00853F", secondaryColor: "#FDEF42" },
  { code: "EGY", name: "Egypt", flagEmoji: "🇪🇬", confederation: "CAF", primaryColor: "#CE1126", secondaryColor: "#000000" },
  { code: "GHA", name: "Ghana", flagEmoji: "🇬🇭", confederation: "CAF", primaryColor: "#CE1126", secondaryColor: "#FCD116" },
  { code: "TUN", name: "Tunisia", flagEmoji: "🇹🇳", confederation: "CAF", primaryColor: "#E70013", secondaryColor: "#FFFFFF" },
  { code: "ALG", name: "Algeria", flagEmoji: "🇩🇿", confederation: "CAF", primaryColor: "#006233", secondaryColor: "#FFFFFF" },
  { code: "CIV", name: "Ivory Coast", flagEmoji: "🇨🇮", confederation: "CAF", primaryColor: "#F77F00", secondaryColor: "#009E60" },
  { code: "RSA", name: "South Africa", flagEmoji: "🇿🇦", confederation: "CAF", primaryColor: "#007A4D", secondaryColor: "#FFB612" },
  { code: "CPV", name: "Cape Verde", flagEmoji: "🇨🇻", confederation: "CAF", primaryColor: "#003893", secondaryColor: "#CF2027" },
  { code: "COD", name: "DR Congo", flagEmoji: "🇨🇩", confederation: "CAF", primaryColor: "#007FFF", secondaryColor: "#F7D618" },
  // OFC
  { code: "NZL", name: "New Zealand", flagEmoji: "🇳🇿", confederation: "OFC", primaryColor: "#0033A0", secondaryColor: "#FFFFFF" }
];
