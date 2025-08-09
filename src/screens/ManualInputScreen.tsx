import React, { useMemo, useRef, useState } from 'react';
import styled from 'styled-components/native';
import { ActivityIndicator, Animated, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;


export default function ManualInputScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Results shown on next screen

  const canGenerate = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);
  const CHAR_LIMIT = 160;
  const charPulse = useRef(new Animated.Value(0.6)).current;
  // Only animated pulse for char counter

  const onGenerate = async () => {
    if (!input.trim()) {
      setError('Please enter a message first.');
      return;
    }
    setError(null);
    Keyboard.dismiss();
    setLoading(true);
    Haptics.selectionAsync();
    setTimeout(() => {
      setLoading(false);
      // Navigate to dedicated results screen
      (navigation as any).navigate('ManualResults', { seed: input.trim() });
    }, 800);
  };

  // removed results/actions; handled in ManualResultsScreen

  return (
    <Container>
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <ScrollContent
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
          contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, flexGrow: 1, justifyContent: 'center' }}
        >
          <Title accessibilityRole="header">Craft Your Rizz ✨</Title>
          <Subtitle>Type your opener. I’ll spin options across vibes.</Subtitle>

          <Card focused={false} accessible accessibilityLabel="Message input card">
            <Input
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
              placeholder="Hey, are we still on for Friday?"
              placeholderTextColor="#9ca3af"
              accessibilityLabel="Message input"
            />
            <CharCount style={{ opacity: charPulse }}>{`${Math.min(input.length, CHAR_LIMIT)}/${CHAR_LIMIT}`}</CharCount>
          </Card>
          {error && <ErrorText accessibilityLiveRegion="polite">{error}</ErrorText>}

          <CtaButton
            accessibilityRole="button"
            accessibilityLabel="Generate replies"
            disabled={!canGenerate}
            activeOpacity={0.9}
            onPress={onGenerate}
          >
            {loading ? <ActivityIndicator color="#ffffff" /> : <CtaText>Generate Replies</CtaText>}
          </CtaButton>

          {/* Results removed; handled in ManualResultsScreen */}
        </ScrollContent>
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
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  text-align: center;
`;

const Subtitle = styled.Text`
  font-size: 14px;
  color: #6b7280;
  text-align: center;
`;

const Card = styled.View<{ focused: boolean }>`
  width: 92%;
  margin-top: 16px;
  border-radius: 16px;
  background-color: #ffffff;
  padding: 6px;
  shadow-color: #000000;
  shadow-opacity: 0.07;
  shadow-radius: 10px;
  shadow-offset: 0px 4px;
  elevation: 2;
`;

const Input = styled.TextInput`
  min-height: 140px;
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

const ErrorText = styled.Text`
  margin-top: 8px;
  text-align: center;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
`;

const CtaButton = styled.TouchableOpacity<{ disabled?: boolean }>`
  margin-top: 16px;
  height: 52px;
  border-radius: 16px;
  background-color: #6E56CF;
  align-items: center;
  justify-content: center;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  width: 92%;
`;

const CtaText = styled.Text`
  color: #ffffff;
  font-weight: 800;
`;

// removed results styles


