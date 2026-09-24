import { LibraryFilters } from '../components/LibraryFilters/LibraryFilters';
import { LibraryIntro } from '../components/LibraryIntro/LibraryIntro';

export const LibraryPage = (): Node[] => [LibraryIntro(), LibraryFilters()];
