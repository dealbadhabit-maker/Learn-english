export interface VocabItem {
  id: string;
  english: string;
  vietnamese: string;
}

export enum AppView {
  INPUT = 'INPUT',
  FLASHCARDS = 'FLASHCARDS',
  PRONUNCIATION = 'PRONUNCIATION',
}

export enum FlashcardSide {
  ENGLISH = 'ENGLISH',
  VIETNAMESE = 'VIETNAMESE',
}
