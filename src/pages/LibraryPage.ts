import { LibraryFilters } from '../components/LibraryFilters/LibraryFilters';
import { LibraryGames } from '../components/LibraryGames/LibraryGames';
import { LibraryIntro } from '../components/LibraryIntro/LibraryIntro';

export const LibraryPage = (): Node[] => [LibraryIntro(), LibraryFilters(), LibraryGames()];
