export interface DeckConfig {
  id: string;
  name: string;
  count: number;
  color: string;
  textureUrl?: string; // Optional texture URL for 3D planet skin, empty = glass effect
}

export const DECKS: DeckConfig[] = [
  {
    id: 'cet4',
    name: 'CET-4 Vocabulary (Mock)',
    count: 3,
    color: '#e74c3c',
    textureUrl: '', // Empty = use glass effect
  },
  {
    id: 'cet4_imported',
    name: 'CET-4 Vocabulary (Full)',
    count: 4028,
    color: '#3498db',
    textureUrl: '/Dictionaries/earth_texture.png', // Use Earth texture
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
