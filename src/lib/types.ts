export type Chapter = {
  id: string;
  order: number;
  part: number;
  book: number;
  bookTitle: string;
  chapter: number;
  title: string;
  sourceUrl: string;
};
export type Quote = {
  id: string;
  text: string;
  speaker: string;
  theme: string;
  chapterId: string;
  context: string;
};
