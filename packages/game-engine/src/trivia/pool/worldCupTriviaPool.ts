import type { AnswerKey, PooledTriviaQuestion } from "@world-cup-game/types";

/**
 * Starter pool of factual, nation-tagged trivia for the 2026 World Cup field.
 *
 * Content rules (App Store Guideline 5.2.1 / IP safety):
 *  - No FIFA marks, official competition logos, emblems, mascots, or trophy imagery.
 *  - Facts only (kits, nicknames, capitals, venues, historical results, famous players).
 *  - Each question is tagged with the subject nation's `nationCode`.
 *
 * Reviewed and expanded over time; gaps are surfaced by the schedule generator.
 */

const KEYS: readonly AnswerKey[] = ["A", "B", "C", "D"];

function mk(
  id: string,
  nationCode: string,
  question: string,
  options: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  explanation: string,
  difficulty = "standard",
): PooledTriviaQuestion {
  return {
    id,
    nationCode,
    question,
    answerOptions: options.map((label, i) => ({ key: KEYS[i] as AnswerKey, label })),
    correctAnswerKey: KEYS[correctIndex] as AnswerKey,
    explanation,
    difficulty,
  };
}

export const WORLD_CUP_TRIVIA_POOL: PooledTriviaQuestion[] = [
  // ---------- Brazil ----------
  mk("BRA-001", "BRA", "What is the primary color of Brazil's traditional home shirt?",
    ["Blue", "Yellow", "Red", "White"], 1,
    "Brazil's iconic home shirt is canary yellow with green trim."),
  mk("BRA-002", "BRA", "By what nickname is Brazil's national team commonly known?",
    ["La Albiceleste", "Seleção", "Azzurri", "Oranje"], 1,
    "\"Seleção\" (the selection) is Brazil's common nickname."),
  mk("BRA-003", "BRA", "Which Brazilian city is home to the famous Maracanã stadium?",
    ["São Paulo", "Brasília", "Rio de Janeiro", "Salvador"], 2,
    "The Maracanã is located in Rio de Janeiro."),
  mk("BRA-004", "BRA", "Which Brazilian striker was nicknamed \"O Fenômeno\"?",
    ["Pelé", "Ronaldo Nazário", "Romário", "Kaká"], 1,
    "Ronaldo Nazário was widely nicknamed \"O Fenômeno\" (The Phenomenon)."),

  // ---------- Argentina ----------
  mk("ARG-001", "ARG", "What is Argentina's national team nickname?",
    ["La Albiceleste", "A Seleção", "Les Bleus", "Die Mannschaft"], 0,
    "\"La Albiceleste\" refers to the white-and-sky-blue colors."),
  mk("ARG-002", "ARG", "Argentina's home shirt features vertical stripes of which colors?",
    ["Red and white", "Light blue and white", "Blue and yellow", "Green and white"], 1,
    "Argentina wear light blue and white stripes."),
  mk("ARG-003", "ARG", "What is the capital city of Argentina?",
    ["Córdoba", "Rosario", "Buenos Aires", "Mendoza"], 2,
    "Buenos Aires is Argentina's capital."),
  mk("ARG-004", "ARG", "Which number 10 led Argentina through the 1980s?",
    ["Lionel Messi", "Diego Maradona", "Gabriel Batistuta", "Juan Riquelme"], 1,
    "Diego Maradona was Argentina's talisman in the 1980s."),

  // ---------- France ----------
  mk("FRA-001", "FRA", "What is France's national team nickname?",
    ["Les Bleus", "The Three Lions", "Oranje", "Azzurri"], 0,
    "France are known as \"Les Bleus\" (The Blues)."),
  mk("FRA-002", "FRA", "What is the primary color of France's home shirt?",
    ["White", "Red", "Blue", "Black"], 2,
    "France's home shirt is blue."),
  mk("FRA-003", "FRA", "What is the capital of France?",
    ["Lyon", "Marseille", "Paris", "Lille"], 2,
    "Paris is the capital of France."),
  mk("FRA-004", "FRA", "Which player captained France's 1998 winning side and later managed the team?",
    ["Zinedine Zidane", "Thierry Henry", "Didier Deschamps", "Michel Platini"], 2,
    "Didier Deschamps captained the 1998 side and went on to manage France."),

  // ---------- England ----------
  mk("ENG-001", "ENG", "What is England's national team nickname?",
    ["The Three Lions", "Les Bleus", "Seleção", "La Roja"], 0,
    "England are known as the Three Lions, after the crest."),
  mk("ENG-002", "ENG", "What is the name of England's national stadium in London?",
    ["Old Trafford", "Wembley", "Anfield", "Emirates"], 1,
    "Wembley Stadium is England's national stadium."),
  mk("ENG-003", "ENG", "What is the primary color of England's home shirt?",
    ["Red", "Blue", "White", "Yellow"], 2,
    "England traditionally play in white home shirts."),
  mk("ENG-004", "ENG", "Which England forward scored a hat-trick in the 1966 final at Wembley?",
    ["Bobby Charlton", "Geoff Hurst", "Gary Lineker", "Bobby Moore"], 1,
    "Geoff Hurst scored three goals in the 1966 final."),

  // ---------- Spain ----------
  mk("ESP-001", "ESP", "What is Spain's national team nickname?",
    ["La Roja", "Les Bleus", "Oranje", "Nationalelf"], 0,
    "Spain are known as \"La Roja\" (The Red One)."),
  mk("ESP-002", "ESP", "What is the primary color of Spain's home shirt?",
    ["Blue", "Red", "White", "Green"], 1,
    "Spain play in red home shirts."),
  mk("ESP-003", "ESP", "What is the capital of Spain?",
    ["Barcelona", "Seville", "Madrid", "Valencia"], 2,
    "Madrid is the capital of Spain."),
  mk("ESP-004", "ESP", "Which Spain midfielder was the metronome of their tiki-taka era?",
    ["Xavi", "Sergio Ramos", "David Villa", "Iker Casillas"], 0,
    "Xavi orchestrated Spain's possession-based \"tiki-taka\" style."),

  // ---------- Germany ----------
  mk("GER-001", "GER", "By what German-language nickname is Germany's team known?",
    ["Die Mannschaft", "Les Bleus", "La Roja", "Oranje"], 0,
    "\"Die Mannschaft\" simply means \"The Team\"."),
  mk("GER-002", "GER", "What is the traditional primary color of Germany's home shirt?",
    ["Black", "White", "Red", "Blue"], 1,
    "Germany traditionally wear white home shirts with black trim."),
  mk("GER-003", "GER", "What is the capital of Germany?",
    ["Munich", "Frankfurt", "Berlin", "Hamburg"], 2,
    "Berlin is the capital of Germany."),
  mk("GER-004", "GER", "Which German striker, surname Klose, is among the top international scorers of all time?",
    ["Miroslav Klose", "Gerd Müller", "Thomas Müller", "Lukas Podolski"], 0,
    "Miroslav Klose is one of the highest scorers in the global tournament's history."),

  // ---------- Portugal ----------
  mk("POR-001", "POR", "What is Portugal's national team nickname?",
    ["A Seleção das Quinas", "Les Bleus", "Azzurri", "La Roja"], 0,
    "\"A Seleção das Quinas\" references the shields on the national crest."),
  mk("POR-002", "POR", "What is the primary color of Portugal's home shirt?",
    ["Blue", "Green", "Red", "White"], 2,
    "Portugal play in red (with green) home shirts."),
  mk("POR-003", "POR", "What is the capital of Portugal?",
    ["Porto", "Lisbon", "Braga", "Faro"], 1,
    "Lisbon is the capital of Portugal."),
  mk("POR-004", "POR", "Which forward is Portugal's all-time leading scorer, famed for the number 7?",
    ["Luís Figo", "Cristiano Ronaldo", "Eusébio", "Rui Costa"], 1,
    "Cristiano Ronaldo is Portugal's record scorer."),

  // ---------- Netherlands ----------
  mk("NED-001", "NED", "What is the Netherlands' national team nickname?",
    ["Oranje", "Les Bleus", "The Three Lions", "Azzurri"], 0,
    "The Dutch are known as \"Oranje\" for their orange shirts."),
  mk("NED-002", "NED", "What is the primary color of the Netherlands' home shirt?",
    ["Blue", "Orange", "White", "Red"], 1,
    "The Netherlands play in orange, the national color."),
  mk("NED-003", "NED", "What is the capital of the Netherlands?",
    ["Rotterdam", "The Hague", "Amsterdam", "Eindhoven"], 2,
    "Amsterdam is the capital of the Netherlands."),
  mk("NED-004", "NED", "Which Dutch icon is most associated with \"Total Football\"?",
    ["Johan Cruyff", "Marco van Basten", "Dennis Bergkamp", "Ruud Gullit"], 0,
    "Johan Cruyff embodied the Dutch \"Total Football\" philosophy."),

  // ---------- Italy ----------
  mk("ITA-001", "ITA", "What is Italy's national team nickname?",
    ["Azzurri", "La Roja", "Oranje", "Les Bleus"], 0,
    "Italy are the \"Azzurri\" (The Blues)."),
  mk("ITA-002", "ITA", "What is the primary color of Italy's home shirt?",
    ["White", "Green", "Blue", "Red"], 2,
    "Italy play in azure blue (\"azzurro\")."),
  mk("ITA-003", "ITA", "What is the capital of Italy?",
    ["Milan", "Rome", "Naples", "Turin"], 1,
    "Rome is the capital of Italy."),
  mk("ITA-004", "ITA", "Which long-serving goalkeeper captained Italy for many years, surname Buffon?",
    ["Gianluigi Buffon", "Paolo Maldini", "Fabio Cannavaro", "Andrea Pirlo"], 0,
    "Gianluigi Buffon is one of Italy's most-capped captains."),

  // ---------- Belgium ----------
  mk("BEL-001", "BEL", "What is the nickname of Belgium's national team?",
    ["Red Devils", "Oranje", "Les Bleus", "Azzurri"], 0,
    "Belgium are known as the Red Devils."),
  mk("BEL-002", "BEL", "What is the capital of Belgium?",
    ["Antwerp", "Bruges", "Brussels", "Ghent"], 2,
    "Brussels is the capital of Belgium."),
  mk("BEL-003", "BEL", "What is the primary color of Belgium's home shirt?",
    ["Red", "Blue", "White", "Black"], 0,
    "Belgium play in red home shirts."),
  mk("BEL-004", "BEL", "Which Belgian playmaker starred for years at Manchester City, surname De Bruyne?",
    ["Kevin De Bruyne", "Eden Hazard", "Romelu Lukaku", "Vincent Kompany"], 0,
    "Kevin De Bruyne is a creative midfield star for Belgium."),

  // ---------- Croatia ----------
  mk("CRO-001", "CRO", "Croatia's home shirt is famous for a pattern of which colors?",
    ["Red and white checks", "Blue and black", "Green and white", "Solid orange"], 0,
    "Croatia's red-and-white checkerboard is instantly recognizable."),
  mk("CRO-002", "CRO", "What is the capital of Croatia?",
    ["Split", "Zagreb", "Rijeka", "Dubrovnik"], 1,
    "Zagreb is the capital of Croatia."),
  mk("CRO-003", "CRO", "Which Croatian midfielder won the 2018 Ballon d'Or, surname Modrić?",
    ["Luka Modrić", "Ivan Rakitić", "Mario Mandžukić", "Ivan Perišić"], 0,
    "Luka Modrić won the 2018 Ballon d'Or."),
  mk("CRO-004", "CRO", "What is Croatia's national team nickname?",
    ["Vatreni (The Blazers)", "Oranje", "Azzurri", "La Roja"], 0,
    "Croatia are nicknamed \"Vatreni\" (The Blazers)."),

  // ---------- Mexico ----------
  mk("MEX-001", "MEX", "What is Mexico's national team nickname?",
    ["El Tri", "La Roja", "Oranje", "Azzurri"], 0,
    "Mexico are \"El Tri\", after the tricolor flag."),
  mk("MEX-002", "MEX", "What is the primary color of Mexico's home shirt?",
    ["Red", "Green", "White", "Blue"], 1,
    "Mexico play in green home shirts."),
  mk("MEX-003", "MEX", "What is the capital of Mexico?",
    ["Guadalajara", "Monterrey", "Mexico City", "Cancún"], 2,
    "Mexico City is the capital of Mexico."),
  mk("MEX-004", "MEX", "Which Mexico City stadium famously hosted major international finals in 1970 and 1986?",
    ["Estadio Akron", "Estadio Azteca", "Estadio BBVA", "Estadio Jalisco"], 1,
    "The Estadio Azteca hosted finals in 1970 and 1986."),

  // ---------- United States ----------
  mk("USA-001", "USA", "What is the common nickname/abbreviation for the US men's national team?",
    ["USMNT", "El Tri", "Oranje", "Les Bleus"], 0,
    "The US men's national team is widely abbreviated USMNT."),
  mk("USA-002", "USA", "What is the capital of the United States?",
    ["New York", "Los Angeles", "Washington, D.C.", "Chicago"], 2,
    "Washington, D.C. is the US capital."),
  mk("USA-003", "USA", "MetLife Stadium, a major 2026 venue, sits just outside which US city?",
    ["Los Angeles", "New York", "Miami", "Dallas"], 1,
    "MetLife Stadium is in East Rutherford, New Jersey, near New York City."),
  mk("USA-004", "USA", "SoFi Stadium, another marquee US venue, is located in which metro area?",
    ["Los Angeles", "Seattle", "Atlanta", "Boston"], 0,
    "SoFi Stadium is in Inglewood, in the Los Angeles area."),

  // ---------- Japan ----------
  mk("JPN-001", "JPN", "What is Japan's national team nickname?",
    ["Samurai Blue", "Taegeuk Warriors", "El Tri", "Oranje"], 0,
    "Japan's men's team is nicknamed Samurai Blue."),
  mk("JPN-002", "JPN", "What is the capital of Japan?",
    ["Osaka", "Kyoto", "Tokyo", "Nagoya"], 2,
    "Tokyo is the capital of Japan."),
  mk("JPN-003", "JPN", "What is the primary color of Japan's home shirt?",
    ["Red", "Blue", "White", "Green"], 1,
    "Japan play in blue home shirts."),
  mk("JPN-004", "JPN", "Which Japanese midfielder was a 1990s–2000s pioneer in Italy's Serie A, surname Nakata?",
    ["Keisuke Honda", "Shinji Kagawa", "Hidetoshi Nakata", "Takumi Minamino"], 2,
    "Hidetoshi Nakata was a trailblazing Japanese star in Serie A."),

  // ---------- South Korea ----------
  mk("KOR-001", "KOR", "What is South Korea's national team nickname?",
    ["Taegeuk Warriors", "Samurai Blue", "El Tri", "Azzurri"], 0,
    "South Korea are the Taegeuk Warriors."),
  mk("KOR-002", "KOR", "What is the capital of South Korea?",
    ["Busan", "Seoul", "Incheon", "Daegu"], 1,
    "Seoul is the capital of South Korea."),
  mk("KOR-003", "KOR", "What is the primary color of South Korea's home shirt?",
    ["Blue", "Red", "White", "Black"], 1,
    "South Korea play in red home shirts."),
  mk("KOR-004", "KOR", "Which forward was Tottenham's long-time captain, surname Son?",
    ["Son Heung-min", "Park Ji-sung", "Ki Sung-yueng", "Lee Kang-in"], 0,
    "Son Heung-min captained Tottenham and South Korea."),

  // ---------- Morocco ----------
  mk("MAR-001", "MAR", "What is Morocco's national team nickname?",
    ["The Atlas Lions", "The Pharaohs", "The Eagles", "The Lions of Teranga"], 0,
    "Morocco are the Atlas Lions."),
  mk("MAR-002", "MAR", "What is the capital of Morocco?",
    ["Casablanca", "Marrakesh", "Rabat", "Fez"], 2,
    "Rabat is the capital of Morocco."),
  mk("MAR-003", "MAR", "What is the primary color of Morocco's home shirt?",
    ["Red", "Green", "Blue", "White"], 0,
    "Morocco play in red home shirts."),
  mk("MAR-004", "MAR", "In 2022 Morocco became the first African nation to reach which stage of the global tournament?",
    ["Quarter-final", "Semi-final", "Final", "Round of 16"], 1,
    "Morocco reached the semi-final in 2022, a first for an African nation."),
];
