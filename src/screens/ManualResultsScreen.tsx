import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components/native';
import { ActivityIndicator, Animated, Pressable } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Tone } from '../navigation/types';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { addHistoryItem } from '../storage/history';
import { bumpMetric } from '../storage/trending';
import { lineId } from '../lib/hash';
import { generateAllTones, generateManyForTone, prettyOpenAIError } from '../services/openai';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = { key: string; name: 'ManualResults'; params: { seed: string } };

const TONES: Tone[] = ['Flirty', 'Polite', 'Funny', 'Direct', 'Witty'];

type Suggestion = { id: string; text: string; tone: Tone };

export default function ManualResultsScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const seed = route.params?.seed ?? '';
  const [loading, setLoading] = useState(true);
  const [activeTone, setActiveTone] = useState<Tone>('Flirty');
  const [suggestions, setSuggestions] = useState<Record<Tone, Suggestion[]>>({
    Flirty: [], Polite: [], Funny: [], Direct: [], Witty: [],
  });
  const [cooldown, setCooldown] = useState(0);
  const [toneLoading, setToneLoading] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true);
      try {
        await Haptics.selectionAsync();
        const all = await generateAllTones(seed, 4);
        // Transform into Suggestion structure
        const mapped = (t: Tone) => (all[t] || []).map((text, idx) => ({
          id: `${t}-${Date.now()}-${idx}`,
          text,
          tone: t,
        }));
        setSuggestions({
          Flirty: mapped('Flirty'),
          Polite: mapped('Polite'),
          Funny: mapped('Funny'),
          Direct: mapped('Direct'),
          Witty: mapped('Witty'),
        });
        setActiveTone('Flirty');
        fade.setValue(0);
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      } catch (e: any) {
        const msg = prettyOpenAIError(e);
        Toast.show({ 
          type: 'error', 
          text1: 'Couldn\'t generate replies', 
          text2: msg
        });
        // If the result was completely empty (e.g., API key missing), show a gentle hint
        if (String(e?.message || '').includes('empty_result')) {
          Toast.show({ type: 'info', text1: 'No suggestions yet', text2: 'Check your API key or try again in a moment.' });
        }
      } finally {
        setLoading(false);
      }
    };
    loadSuggestions();
  }, [seed]);

  useEffect(() => {
    if (!cooldown) return;
    const id = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const onCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show({ type: 'success', text1: 'Copied! 🔥' });
    await bumpMetric(lineId(text), 'copies');
  };

  const onSave = async (text: string, tone: Tone) => {
    const now = Date.now();
    await addHistoryItem({ id: String(now), text, tone, createdAt: now });
    Toast.show({ type: 'success', text1: 'Saved!', text2: 'You’ll see more like this in Pickup → Trending ✨' });
    await bumpMetric(lineId(text), 'saves');
  };

  const onRegenerateTone = async (t: Tone) => {
    if (cooldown || toneLoading) return;
    setCooldown(5);
    setToneLoading(true);
    try {
      await Haptics.selectionAsync();
      const replies = await generateManyForTone({ seed, tone: t, count: 4 });
      setSuggestions(prev => ({ 
        ...prev, 
        [t]: replies.map((text, idx) => ({ 
          id: `${t}-${Date.now()}-${idx}`, 
          text, 
          tone: t 
        })) 
      }));
    } catch (e) {
      Toast.show({ 
        type: 'error', 
        text1: 'Regeneration failed', 
        text2: prettyOpenAIError(e)
      });
    } finally {
      setToneLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Back onPress={() => navigation.goBack()} accessibilityLabel="Go back" accessibilityRole="button">‹</Back>
        <HeaderTitle>Results</HeaderTitle>
        <Back style={{ opacity: 0 }}> </Back>
      </Header>

      {loading ? (
        <LoadingWrap>
          <ActivityIndicator />
        </LoadingWrap>
      ) : (
        <AnimatedResults style={{ opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
          <TabsRow>
            {TONES.map((t) => (
              <Tab key={t} active={activeTone === t} onPress={() => { setActiveTone(t); Haptics.selectionAsync(); }} accessibilityRole="button" accessibilityLabel={`Switch to ${t}`}>
                <TabText active={activeTone === t}>{t}</TabText>
              </Tab>
            ))}
          </TabsRow>

          <List>
            {suggestions[activeTone].map((s) => (
              <SuggestionCard key={s.id}>
                <SuggestionText>{s.text}</SuggestionText>
                <Actions>
                  <SmallGhost onPress={() => onCopy(s.text)} accessibilityLabel="Copy suggestion" activeOpacity={0.85}>
                    <SmallGhostText>Copy</SmallGhostText>
                  </SmallGhost>
                  <SmallGhost onPress={() => onSave(s.text, s.tone)} accessibilityLabel="Save suggestion" activeOpacity={0.85}>
                    <SmallGhostText>Save</SmallGhostText>
                  </SmallGhost>
                </Actions>
              </SuggestionCard>
            ))}
          </List>

          <Regenerate 
            disabled={toneLoading || cooldown > 0}
            onPress={() => onRegenerateTone(activeTone)} 
            accessibilityLabel="Regenerate this tone" 
            activeOpacity={0.85}
          >
            {toneLoading ? (
              <ActivityIndicator size="small" color="#374151" />
            ) : (
              <RegenerateText>
                Regenerate {activeTone}{cooldown > 0 ? ` (${cooldown}s)` : ''}
              </RegenerateText>
            )}
          </Regenerate>
        </AnimatedResults>
      )}
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #FAFBFC;
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 0 16px;
`;

const Back = styled.Text`
  font-size: 24px;
  color: #111827;
`;

const HeaderTitle = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const LoadingWrap = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const AnimatedResults = styled(Animated.View)`
  padding: 16px;
`;

const TabsRow = styled.View`
  width: 100%;
  flex-direction: row;
  background-color: #F3F4F6;
  padding: 6px;
  border-radius: 999px;
`;

const Tab = styled.Pressable<{ active?: boolean }>`
  flex: 1;
  height: 38px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background-color: ${({ active }) => (active ? '#6E56CF' : 'transparent')};
`;

const TabText = styled.Text<{ active?: boolean }>`
  color: ${({ active }) => (active ? '#ffffff' : '#374151')};
  font-weight: 700;
  font-size: 13px;
`;

const List = styled.View`
  margin-top: 12px;
`;

const SuggestionCard = styled(Pressable)`
  background-color: #ffffff;
  border-radius: 14px;
  padding: 14px;
  shadow-color: #000000;
  shadow-opacity: 0.06;
  shadow-radius: 10px;
  shadow-offset: 0px 4px;
  elevation: 2;
  margin-bottom: 10px;
`;

const SuggestionText = styled.Text`
  color: #111827;
  font-size: 15px;
  line-height: 22px;
`;

const Actions = styled.View`
  flex-direction: row;
  margin-top: 10px;
`;

const SmallGhost = styled.TouchableOpacity`
  padding: 8px 12px;
  border-radius: 999px;
  background-color: #EEF2FF;
  margin-right: 8px;
`;

const SmallGhostText = styled.Text`
  color: #4F46E5;
  font-weight: 700;
  font-size: 13px;
`;

const Regenerate = styled.TouchableOpacity<{ disabled?: boolean }>`
  align-self: center;
  margin-top: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  background-color: #F3F4F6;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

const RegenerateText = styled.Text`
  font-size: 13px;
  color: #374151;
  font-weight: 700;
`;


