import React, { useMemo, useMemo as useMemoAlias, useRef, useState } from 'react';
import styled from 'styled-components/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, Tone } from '../navigation/types';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, Animated, FlatList } from 'react-native';
import * as Haptics from 'expo-haptics';
import TonePicker, { TonePick, useToneList } from '../components/TonePicker';

type PromptRoute = { key: string; name: 'Prompt'; params?: { presetText?: string; presetTone?: Tone } };

export default function PromptBuilderScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PromptRoute>();
  const initialPreset = route?.params?.presetText ?? '';
  const initialTone = route?.params?.presetTone ?? null;
  const [input, setInput] = useState(initialPreset);
  const [tone, setTone] = useState<Tone | null>(initialTone);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const canGenerate = useMemo(() => input.trim().length > 0 && !!tone && !loading, [input, tone, loading]);

  const CHAR_LIMIT = 160;
  const charPulse = useRef(new Animated.Value(0.6)).current;

  const handleSelectTone = (t: TonePick) => {
    setTone(t === 'Surprise' ? 'Flirty' : t);
    Haptics.selectionAsync();
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.select({ ios: 12, android: 0 })}
      >
        <ScrollContent
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
        >
          <HeaderTitleBig accessibilityRole="header">Craft Your Rizz ✨</HeaderTitleBig>
          <SubtitleCenter>Type your opener or paste your chat. I’ll make it shine.</SubtitleCenter>

          <MessageCard focused={focused} accessible accessibilityLabel="Message input card">
            <MessageInput
              multiline
              value={input}
              onChangeText={(text) => {
                if (text.length <= CHAR_LIMIT) {
                  setInput(text);
                } else {
                  setInput(text.slice(0, CHAR_LIMIT));
                  Animated.sequence([
                    Animated.timing(charPulse, { toValue: 1, duration: 120, useNativeDriver: true }),
                    Animated.timing(charPulse, { toValue: 0.6, duration: 200, useNativeDriver: true }),
                  ]).start();
                }
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Hey, are we still on for Friday?"
              placeholderTextColor="#9ca3af"
              accessibilityLabel="Message input"
              accessibilityHint="Enter or paste the message you want help crafting"
            />
            <CharCount style={{ opacity: charPulse }}>{`${Math.min(input.length, CHAR_LIMIT)}/${CHAR_LIMIT}`}</CharCount>
          </MessageCard>

          <TonePicker selected={(tone as TonePick) ?? null} onSelect={handleSelectTone} />
        </ScrollContent>

        <Footer>
          <BottomBar>
            <BottomLeft>{tone ? `Tone: ${tone}` : 'Pick a tone'}</BottomLeft>
            <CtaWrapper pointerEvents={canGenerate ? 'auto' : 'none'}>
              <CtaButton disabled={!canGenerate} activeOpacity={0.9} onPress={() => navigation.navigate('ManualResults', { seed: input.trim() })} accessibilityRole="button" accessibilityLabel="Generate reply" accessibilityState={{ disabled: !canGenerate }}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <CtaText>Generate Reply →</CtaText>}
              </CtaButton>
            </CtaWrapper>
          </BottomBar>
        </Footer>
      </KeyboardAvoidingView>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #FAFBFC;
`;

const ScrollContent = styled.ScrollView`
  flex: 1;
  padding-top: 24px;
  padding-bottom: 8px;
`;

const HeaderTitleBig = styled.Text`
  margin-top: 8px;
  font-size: 26px;
  font-weight: 800;
  color: #111827;
  text-align: center;
`;

const SubtitleCenter = styled.Text`
  margin-top: 8px;
  font-size: 16px;
  color: #6b7280;
  text-align: center;
  padding: 0 24px;
`;

const MessageCard = styled.View<{ focused: boolean }>`
  width: 92%;
  align-self: center;
  margin-top: 24px;
  border-radius: 16px;
  background-color: #F7F8FA;
  padding: 6px;
  shadow-color: #000000;
  shadow-opacity: 0.07;
  shadow-radius: 10px;
  shadow-offset: 0px 4px;
  elevation: 2;
  border-width: ${({ focused }) => (focused ? '1.5px' : '1px')};
  border-color: ${({ focused }) => (focused ? '#715DF2' : '#e5e7eb')};
`;

const MessageInput = styled.TextInput`
  min-height: 160px;
  padding: 16px;
  border-radius: 14px;
  color: #111827;
  text-align-vertical: top;
`;

const CharCount = styled(Animated.Text)`
  position: absolute;
  right: 14px;
  bottom: 10px;
  color: #6b7280;
  font-size: 12px;
`;

const HelperText = styled.Text`
  margin-top: 8px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
`;

const ErrorText = styled.Text`
  margin-top: 8px;
  text-align: center;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
`;

const ToneList = styled(FlatList as new () => FlatList<{ key: Tone; emoji: string; label: string; scale: Animated.Value }>)``;

const ToneCardPressable = styled(Pressable)`
  margin-left: 12px;
`;

const ToneCard = styled.View<{ active?: boolean }>`
  min-width: 104px;
  padding: 12px;
  border-radius: 14px;
  background-color: ${({ active }) => (active ? '#F1EDFF' : '#F2F4F7')};
  border-width: 1px;
  border-color: ${({ active }) => (active ? '#A896FF' : '#E5E7EB')};
  align-items: center;
  justify-content: center;
  shadow-color: #000000;
  shadow-opacity: ${({ active }) => (active ? 0.08 : 0)};
  shadow-radius: 12px;
  shadow-offset: 0px 6px;
`;

const AnimatedToneCard = Animated.createAnimatedComponent(ToneCard);

const ToneEmojiBig = styled.Text`
  font-size: 24px;
`;

const ToneLabel = styled.Text<{ active?: boolean }>`
  margin-top: 6px;
  font-size: 14px;
  font-weight: 800;
  color: ${({ active }) => (active ? '#1F2937' : '#1F2937')};
`;

const Footer = styled.View`
  padding: 8px 16px 16px 16px;
`;

const BottomBar = styled.View`
  margin-top: 8px;
  padding: 12px 16px;
  background-color: #ffffff;
  border-radius: 20px;
  shadow-color: #000000;
  shadow-opacity: 0.12;
  shadow-radius: 16px;
  shadow-offset: 0px 8px;
  elevation: 4;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const BottomLeft = styled.Text`
  color: #1F2937;
  font-size: 14px;
`;

const CtaWrapper = styled.View``;

const CtaButton = styled.TouchableOpacity<{ disabled?: boolean }>`
  height: 52px;
  min-width: 170px;
  padding: 0 16px;
  border-radius: 16px;
  background-color: #6E56CF;
  align-items: center;
  justify-content: center;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`;

const CtaText = styled.Text`
  color: #ffffff;
  font-weight: 800;
`;

const WeakOcrNote = styled.Text`
  margin-top: 6px;
  text-align: center;
  color: #9ca3af;
  font-size: 12px;
`;


