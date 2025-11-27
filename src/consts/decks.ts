import { PlanetConfig, SatelliteConfig } from './home3d';

export interface DeckConfig {
  id: string;
  name: string;
  count: number;
  color: string;
  textureUrl?: string; // Optional texture URL for 3D planet skin, empty = glass effect
  planetConfig?: Partial<PlanetConfig>;
  satelliteConfig?: Partial<SatelliteConfig>;
}

export const DECKS: DeckConfig[] = [
  {
    id: 'englishCommonPhrases',
    name: '常用短语',
    count: 4000,
    color: '#e74c3c',
    textureUrl: '', // Empty = use glass effect
    planetConfig: {
      ORBIT_RADIUS: 1, // Custom orbit radius
      BASE_RADIUS: 0.1, // Slightly larger
      // ROTATION_SPEED: 4.01, // Slower rotation for Earth
    },
    satelliteConfig: {
      SIZE: 0.06, // Larger satellites
    }
  },
  {
    id: 'cet4',
    name: 'CET-4 Vocabulary (Full)',
    count: 4028,
    color: '#3498db',
    textureUrl: '/Dictionaries/earth_texture.png', // Use Earth texture
    planetConfig: {
      ORBIT_RADIUS: 2, // Further out
      BASE_RADIUS: 0.6, // Larger planet (Earth)
      // ROTATION_SPEED: 0.05, // Slower rotation for Earth
    },
    satelliteConfig: {
      ORBIT_SPEED_MIN: 0.2, // Slower satellites
    }
  },
];

// Helper function to get deck by ID
export function getDeckById(id: string): DeckConfig | undefined {
  return DECKS.find(deck => deck.id === id);
}

// Helper function to get all deck IDs
export function getAllDeckIds(): string[] {
  return DECKS.map(deck => deck.id);
}
