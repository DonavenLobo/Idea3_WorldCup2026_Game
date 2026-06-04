import { WORLD_CUP_STADIUMS } from "./stadiums.data";

export interface Stadium {
  /** Host city; exact join key to Fixture.venueCity. */
  city: string;
  name: string;
  capacity: number;
  /** ISO country code of the host country (for a venue flag). */
  cc: string;
  /** Display-only venue timezone label, e.g. "UTC-7". */
  timezone: string;
  lat: number;
  lng: number;
}

export { WORLD_CUP_STADIUMS };

const STADIUM_BY_CITY = new Map<string, Stadium>(
  WORLD_CUP_STADIUMS.map((stadium) => [stadium.city, stadium])
);

export function getStadiumByCity(city: string): Stadium | undefined {
  return STADIUM_BY_CITY.get(city);
}
