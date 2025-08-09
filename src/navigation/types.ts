import type { NavigatorScreenParams } from '@react-navigation/native';

export type Tone = 'Flirty' | 'Polite' | 'Funny' | 'Direct' | 'Witty';

export type HistoryItem = {
  id: string;
  text: string;
  tone: Tone;
  createdAt: number;
};

export type CompatibilityStats = {
  youCount: number;
  themCount: number;
  youInterest: number;   // 0..100
  themInterest: number;  // 0..100
  youWords: string[];
  themWords: string[];
  redFlags: string[];
  greenFlags: string[];
  attachmentYou: 'Secure'|'Anxious'|'Avoidant'|'Unknown';
  attachmentThem: 'Secure'|'Anxious'|'Avoidant'|'Unknown';
  compatibility: number; // 0..100
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  // bottom tabs
  UploadTab: undefined;
  TextTab: undefined;
  InsightsTab: undefined;
  // flows
  ReviewUpload: { imageUri: string };
  ChatAnalyzeReview: { imageUri: string };
  ChatAnalyzeResult: { imageUri: string; stats: CompatibilityStats; summary: string };
  ManualResults: { seed: string };
  PickupLibrary: undefined;
};

export type TabParamList = {
  UploadTab: undefined;
  TextTab: undefined;
  InsightsTab: undefined;
};


