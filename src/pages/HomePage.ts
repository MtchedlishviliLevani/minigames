import { Carousel } from '../components/Carousel/Carousel';
import { DevCta } from '../components/DevCta/DevCta';
import { Hero } from '../components/Hero/Hero';
import { Leaderboard } from '../components/Leaderboard/Leaderboard';

export const HomePage = (): Node[] => [Hero(), Carousel(), Leaderboard(), DevCta()];
