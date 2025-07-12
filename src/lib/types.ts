
import type { Timestamp } from 'firebase/firestore';

// This is a union of all possible model IDs, derived from the constants file.
export type ModelId = string;
export type BadgeId = string;

export type Attachment = {
  file?: { name: string; dataUri: string; type: string };
  url?: string;
};

export type ChartData = {
  type: 'bar' | 'line' | 'area' | 'pie';
  data: Record<string, any>[];
  config: Record<string, { label: string; color: string; }>;
  dataKey: string;
  categories: string[];
  title?: string;
  description?: string;
}

export type AIResponse = {
  modelId: ModelId;
  content: string;
  imageUrl?: string;
  chartData?: ChartData;
  audioDataUri?: string;
  emojiReaction?: string;
};

export type Author = {
  uid: string;
  name: string;
  avatar?: string;
}

// For both UI and what we adapt to send to firestore
export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ownerId?: string; // ID of the chat owner for collection group queries
  author: Author;
  responses?: AIResponse[];
  isSummary?: boolean;
  isCopilotResponse?: boolean;
  feedback?: 'like' | 'dislike';
  userReaction?: string;
  aiReaction?: string;
  isPersonaResponse?: boolean;
  personaName?: string;
  attachment?: Attachment; // This won't be saved to DB
  createdAt?: Timestamp | Date; // Use Date in UI, Timestamp in DB
  detectedLanguage?: string;
  imageUrl?: string;
};

export interface CustomPersona {
  id: string;
  name: string;
  instructions: string;
  icon?: any; // Allow any icon for custom personas
  persona?: string; // For compatibility with base models
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  icon: string;
  color: string;
  createdAt?: Timestamp | Date;
}

export interface ChatSummary {
  id: string;
  title: string;
  workspaceId?: string;
  isStarred: boolean;
  ownerId: string;
  members: string[];
  aiMembers?: ModelId[];
  customPersonas?: CustomPersona[];
  defaultModelId?: ModelId;
  expiresAt?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
}
