export interface GameFact {
  label: string;
  value: string;
}

export interface GameRecord {
  medal: string;
  player: string;
  score: string;
  achievedAt: string;
}

export interface GameComment {
  initial: string;
  author: string;
  postedAt: string;
  body: string;
  likes: number;
}

export interface GameDetails {
  slug: string;
  name: string;
  image: string;
  rating: string;
  likes: string;
  description: string;
  facts: GameFact[];
  records: GameRecord[];
  comments: GameComment[];
}

export const GAME_DETAILS: GameDetails = {
  slug: 'tukoni-forest-keepers',
  name: 'Tukoni: Forest Keepers',
  image: '/assets/images/games/tukoni-forest-keepers-card.jpg',
  rating: '4.9',
  likes: '31.2K',
  description:
    'Tukoni: Forest Keepers — a cozy hand-drawn puzzle-adventure. You are Traveller, a little forest spirit on an important mission. Wander storybook meadows, visit mushroom villages, meet adorable inhabitants, solve gentle hand-crafted puzzles, brew herbal teas and help the Tukoni forest prepare peacefully for the coming winter.',
  facts: [
    { label: 'Genre', value: 'Puzzle' },
    { label: 'Players', value: 'Solo' },
    { label: 'Duration', value: '40-90 min' },
    { label: 'Price', value: 'Free' },
  ],
  records: [
    { medal: '🥇', player: 'ForestSpirit', score: '356,700 pts', achievedAt: '2 days ago' },
    { medal: '🥈', player: 'TeaBrewer', score: '332,400 pts', achievedAt: '5 days ago' },
    { medal: '🥉', player: 'HerbalistPath', score: '308,900 pts', achievedAt: '1 week ago' },
  ],
  comments: [
    {
      initial: 'F',
      author: 'ForestDweller',
      postedAt: '3 hours ago',
      body: "The hand-drawn art is absolutely magical 🍄 Every location feels like a page from a children's storybook. The mushroom village made me cry happy tears!",
      likes: 12,
    },
    {
      initial: 'H',
      author: 'HerbalTeaLover',
      postedAt: '1 day ago',
      body: 'Perfect cozy evening game — brew a cup of chamomile, wrap in a blanket and help the little Tukoni prepare for winter. The puzzles are gentle but satisfying.',
      likes: 5,
    },
    {
      initial: 'C',
      author: 'CottageCoreMia',
      postedAt: '3 days ago',
      body: 'I want to live inside this game forever 🌿 The NPCs are so charming, the tea recipes are real, and the atmosphere is pure warmth and calm.',
      likes: 8,
    },
  ],
};
