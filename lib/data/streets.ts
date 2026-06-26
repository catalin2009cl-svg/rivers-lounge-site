import streetsData from '@/lib/data/streets.json';

export const STREETS_BY_CITY = streetsData.cities as Record<string, string[]>;

export const SUPPORTED_CITIES = Object.keys(STREETS_BY_CITY);

export function getStreetsForCity(city: string): string[] {
  return STREETS_BY_CITY[city] ?? [];
}
