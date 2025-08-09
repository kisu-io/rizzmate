import type { NavigatorScreenParams } from '@react-navigation/native';

export type Tone = 'Flirty' | 'Polite' | 'Funny' | 'Direct' | 'Witty';

export type HistoryItem = {
  id: string;
  text: string;
  tone: Tone;
  createdAt: number;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  // bottom tabs
  UploadTab: undefined;
  TextTab: undefined;
  PickupTab: undefined;
  // stacked screens
  ReviewUpload: { imageUri: string };
  Result: { input: string; tone: Tone };
  ManualResults: { seed: string };
};

export type TabParamList = {
  UploadTab: undefined;
  TextTab: undefined;
  PickupTab: undefined;
};


