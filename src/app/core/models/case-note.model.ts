export interface CaseNote {
  id: string;
  targetId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  tags: string[];
}

