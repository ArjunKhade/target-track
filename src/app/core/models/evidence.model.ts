export type EvidenceType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' | 'OTHER';

export interface Evidence {
  id: string;
  targetId: string;
  fileName: string;
  fileType: EvidenceType;
  fileSize: number; // bytes
  mimeType: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string; // ISO 8601
  tags: string[];
}

