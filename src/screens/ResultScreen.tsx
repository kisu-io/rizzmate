import React, { useMemo, useState } from 'react';
import styled from 'styled-components/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Tone } from '../navigation/types';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { ActivityIndicator } from 'react-native';
import { addHistoryItem } from '../storage/history';
import { bumpMetric } from '../storage/trending';
import { lineId } from '../lib/hash';

type ResultRoute = { key: string; name: 'Result'; params?: { input: string; tone: Tone } };

function buildReply(input: string, tone: Tone): string {
  const trimmed = input.trim();
  const base = trimmed ? `About your message: "${trimmed}" — ` : '';
  switch (tone) {
    case 'Flirty':
      return base + "Not gonna lie, I kinda like your vibe. How about we grab coffee this week?";
    case 'Polite':
      return base + "I really enjoyed chatting. Would you like to grab a coffee sometime this week?";
    case 'Funny':
      return base + "Quick question: are you a barista? Because I think we’d make a latte sense together. Coffee this week?";
    case 'Direct':
      return base + "I like talking to you. Want to meet for coffee this week?";
    case 'Witty':
      return base + "Low-key convinced we'd crush a coffee chat. Shall we test that hypothesis this week?";
    default:
      return base + "I’d love to continue this. Coffee sometime this week?";
  }
}

export default function ResultScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ResultRoute>();
  const { input, tone } = route.params ?? ({} as any);

  const hasParams = typeof input === 'string' && typeof tone === 'string';
  const generated = useMemo(() => (hasParams ? buildReply(input!, tone as Tone) : ''), [input, tone, hasParams]);
  const [saving, setSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const [copying, setCopying] = useState(false);
  return (
    <Container>
      <HeaderBar>
        <IconButton accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()}>
          <HeaderIcon>‹</HeaderIcon>
        </IconButton>
        <HeaderTitle>Result</HeaderTitle>
        <IconButton style={{ opacity: 0 }}>
          <HeaderIcon> </HeaderIcon>
        </IconButton>
      </HeaderBar>

      <Content>
        <Title>Here’s Your Message</Title>
        <Subtitle>{hasParams ? 'Copy and send it to your match.' : 'We could not find your generated message.'}</Subtitle>

        <MessageWrapper>
          <CopyIconButton activeOpacity={0.85}>
            <CopyIcon>📋</CopyIcon>
          </CopyIconButton>
          <MessageScroll showsVerticalScrollIndicator>
            {hasParams ? (
              <MessageText>{generated}</MessageText>
            ) : (
              <ErrorState>
                <ErrorTitle accessibilityRole="header">Missing data</ErrorTitle>
                <ErrorText>Go back and try generating a reply again.</ErrorText>
              </ErrorState>
            )}
          </MessageScroll>
        </MessageWrapper>

        <Buttons>
          <PrimaryButton
            activeOpacity={0.85}
            accessibilityLabel="Copy message"
            onPress={async () => {
              if (!generated) {
                Toast.show({ type: 'error', text1: 'Nothing to copy', text2: 'Generate a reply first.' });
                return;
              }
              if (copying) return;
              setCopying(true);
              try {
                await Clipboard.setStringAsync(generated);
                Toast.show({ type: 'success', text1: 'Copied!', text2: 'Go slide into those DMs 🔥' });
                await bumpMetric(lineId(generated), 'copies');
              } finally {
                setCopying(false);
              }
            }}
          >
            {copying ? <ActivityIndicator color="#ffffff" /> : <PrimaryButtonText>Copy</PrimaryButtonText>}
          </PrimaryButton>

          <SecondaryButton
            activeOpacity={0.85}
            accessibilityLabel="Save to history"
            disabled={savedOnce || saving}
            onPress={async () => {
              if (!generated || !hasParams) {
                Toast.show({ type: 'error', text1: 'Cannot save', text2: 'Generate a reply first.' });
                return;
              }
              if (saving) return;
              setSaving(true);
              try {
                const now = Date.now();
                await addHistoryItem({ id: String(now), text: generated, tone: tone as Tone, createdAt: now });
                setSavedOnce(true);
                Toast.show({ type: 'success', text1: 'Saved!', text2: 'You’ll see more like this in Pickup → Trending ✨' });
                await bumpMetric(lineId(generated), 'saves');
              } catch (e) {
                Toast.show({ type: 'error', text1: 'Save failed', text2: 'Please try again.' });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? (
              <LoadingRow>
                <ActivityIndicator size="small" color="#4f46e5" />
                <SecondaryButtonText style={{ marginLeft: 8 }}>Saving...</SecondaryButtonText>
              </LoadingRow>
            ) : (
              <SecondaryButtonText>{savedOnce ? 'Saved' : 'Save'}</SecondaryButtonText>
            )}
          </SecondaryButton>

          <GhostButton
            activeOpacity={0.85}
            accessibilityLabel="Try again"
            onPress={() => navigation.navigate('Tabs', { screen: 'TextTab' })}
          >
            <GhostButtonText>Try Again</GhostButtonText>
          </GhostButton>

        </Buttons>
      </Content>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #ffffff;
`;

const Content = styled.View`
  flex: 1;
  padding: 16px 24px 24px 24px;
  align-items: center;
`;

const Title = styled.Text`
  margin-top: 8px;
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  text-align: center;
`;

const Subtitle = styled.Text`
  margin-top: 6px;
  font-size: 16px;
  color: #6b7280;
  text-align: center;
`;

const MessageWrapper = styled.View`
  position: relative;
  width: 100%;
  height: 180px;
  margin-top: 16px;
  border-radius: 16px;
  background-color: #f3f4f6;
  padding: 16px;
  overflow: hidden;
`;

const MessageScroll = styled.ScrollView``;

const MessageText = styled.Text`
  font-size: 16px;
  line-height: 24px;
  color: #111827;
`;

const ErrorState = styled.View`
  padding: 8px;
`;

const ErrorTitle = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const ErrorText = styled.Text`
  margin-top: 4px;
  font-size: 14px;
  color: #6b7280;
`;

const CopyIconButton = styled.TouchableOpacity`
  position: absolute;
  top: 10px;
  right: 10px;
  height: 36px;
  width: 36px;
  border-radius: 18px;
  background-color: #e5e7eb;
  align-items: center;
  justify-content: center;
`;

const CopyIcon = styled.Text`
  font-size: 18px;
`;

const Buttons = styled.View`
  width: 100%;
  margin-top: 20px;
  align-items: center;
`;

const PrimaryButton = styled.TouchableOpacity`
  width: 80%;
  min-height: 56px;
  padding: 14px 16px;
  border-radius: 14px;
  background-color: #6c5ce7;
  align-items: center;
  justify-content: center;
`;

const PrimaryButtonText = styled.Text`
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
`;

const SecondaryButton = styled.TouchableOpacity`
  width: 80%;
  min-height: 56px;
  padding: 14px 16px;
  border-radius: 14px;
  background-color: #eef2ff;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
`;

const SecondaryButtonText = styled.Text`
  color: #4f46e5;
  font-size: 17px;
  font-weight: 700;
`;

const GhostButton = styled.TouchableOpacity`
  width: 80%;
  min-height: 56px;
  padding: 14px 16px;
  border-radius: 14px;
  border-width: 1px;
  border-color: #d1d5db;
  background-color: #ffffff;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
`;

const GhostButtonText = styled.Text`
  color: #374151;
  font-size: 17px;
  font-weight: 700;
`;

const LoadingRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const HeaderBar = styled.View`
  padding: 12px 16px 0 16px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const IconButton = styled.TouchableOpacity`
  padding: 8px;
`;

const HeaderIcon = styled.Text`
  font-size: 20px;
  color: #111827;
`;

const HeaderTitle = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;


