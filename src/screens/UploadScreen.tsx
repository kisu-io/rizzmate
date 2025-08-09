import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Tone } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Animated, Image, ActivityIndicator } from 'react-native';
import { runOCR } from '../ocr/ocr';
import { downscale } from '../ocr/prepare';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { generateOne } from '../services/openai';

type UploadRoute = { key: string; name: 'Upload'; params?: { imageUri?: string } };

export default function UploadScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<UploadRoute>();
  const [imageUri, setImageUri] = useState<string | null>(route?.params?.imageUri ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [tone, setTone] = useState<Tone | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;
  const revealAnim = useRef(new Animated.Value(0)).current;
  const scanningRef = useRef<Animated.CompositeAnimation | null>(null);

  const toneToEmoji = (t: Tone): string => {
    switch (t) {
      case 'Flirty':
        return '😉';
      case 'Polite':
        return '🙏';
      case 'Funny':
        return '😄';
      case 'Direct':
        return '🎯';
      case 'Witty':
        return '🧠';
      default:
        return '😉';
    }
  };

  useEffect(() => {
    const process = async (uri: string) => {
      try {
        setLoading(true);
        // start scan loop
        const loop = Animated.loop(
          Animated.sequence([
            Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
          ])
        );
        scanningRef.current = loop;
        loop.start();

        const prepared = await downscale(uri);
        const text = await runOCR(prepared);
        setOcrText(text);

        // stop scan and reveal bottom bar
        scanningRef.current?.stop();
        Animated.timing(revealAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      } catch (e) {
        setError('Couldn’t read much—try another screenshot');
        Toast.show({ type: 'error', text1: 'OCR issue', text2: 'Couldn’t read much—try another screenshot' });
        // Reveal actions so user could proceed later if needed
        Animated.timing(revealAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
      } finally {
        setLoading(false);
      }
    };

    const pickAndProcess = async () => {
      try {
        const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.9, base64: false, allowsMultipleSelection: false, mediaTypes: ImagePicker.MediaTypeOptions.Images });
        if (res.canceled) {
        navigation.goBack();
          return;
        }
        const uri = res.assets?.[0]?.uri;
        if (!uri) {
          navigation.goBack();
          return;
        }
        setImageUri(uri);
        await process(uri);
      } catch (e) {
        navigation.goBack();
      }
    };

    if (imageUri) {
      process(imageUri);
    } else {
      pickAndProcess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Container>
      <HeaderBar>
        <IconButton
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </IconButton>
        <HeaderSpacer />
        <IconButton
          accessibilityRole="button"
          accessibilityLabel="Go home"
          onPress={() => navigation.navigate('Tabs', { screen: 'TextTab' })}
        >
          <Ionicons name="home-outline" size={20} color="#111827" />
        </IconButton>
      </HeaderBar>

      <Content>
        <Title>Upload a Chat Screenshot</Title>
        <Subtitle>We’ll read it locally and help you reply.</Subtitle>

        {imageUri && (
          <PreviewCard>
            <ImageWrap>
              <StyledImage source={{ uri: imageUri }} resizeMode="cover" accessibilityLabel="Selected image preview" />
              {loading && (
                <ScanOverlay pointerEvents="none">
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      transform: [
                        {
                          translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 200] }),
                        },
                      ],
                    }}
                  >
                    <LinearGradient
                      colors={[ 'rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)' ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={{ height: 56, width: '100%' }}
                    />
                  </Animated.View>
                </ScanOverlay>
              )}
            </ImageWrap>
            {loading && <TipCaption>Reading your chat… all on your device 🔒</TipCaption>}
          </PreviewCard>
        )}

        {error && <ErrorText accessibilityLiveRegion="polite">{error}</ErrorText>}

        {/** No manual actions while processing. */}
      </Content>

      <Footer>
        {/** Bottom bar appears after OCR completes */}
        {!loading && (
          <Animated.View
            style={{
              opacity: revealAnim,
              transform: [{ translateY: revealAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
              width: '100%',
              alignItems: 'center',
            }}
          >
            <BottomBar>
              <LeftPill
                activeOpacity={0.85}
                accessibilityLabel="Choose tone"
                onPress={() => {
                  const cycle: Tone[] = ['Flirty', 'Polite', 'Funny', 'Direct', 'Witty'];
                  setTone((prev) => {
                    if (!prev) return 'Flirty';
                    const i = cycle.indexOf(prev);
                    return cycle[(i + 1) % cycle.length];
                  });
                  Haptics.selectionAsync();
                }}
              >
                <LeftPillEmoji>{toneToEmoji(tone ?? 'Flirty')}</LeftPillEmoji>
              </LeftPill>
              <RightPill
                activeOpacity={0.85}
                accessibilityLabel="Generate answer"
                disabled={genLoading || !tone || !ocrText.trim()}
                onPress={async () => {
                  if (!tone || !ocrText.trim()) return;
                  setGenLoading(true);
                  try {
                    await Haptics.selectionAsync();
                    const reply = await generateOne({ seed: ocrText.trim(), tone });
                    navigation.navigate('Result', { input: reply, tone });
                  } catch (e: any) {
                    Toast.show({ 
                      type: 'error', 
                      text1: 'Generation failed', 
                      text2: e?.message || 'Please try again.' 
                    });
                  } finally {
                    setGenLoading(false);
                  }
                }}
              >
{genLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <RightPillContent>
                    <RightPillIcon>⚡</RightPillIcon>
                    <RightPillText>Generate answer</RightPillText>
                  </RightPillContent>
                )}
              </RightPill>
            </BottomBar>
          </Animated.View>
        )}

      </Footer>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #ffffff;
`;

const Content = styled.View`
  flex: 1;
  padding: 24px;
  align-items: center;
`;

const HeaderBar = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
`;

const HeaderSpacer = styled.View`
  flex: 1;
`;

const IconButton = styled.TouchableOpacity`
  padding: 8px;
`;

const Title = styled.Text`
  margin-top: 8px;
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  text-align: center;
`;

const Subtitle = styled.Text`
  margin-top: 8px;
  font-size: 16px;
  color: #6b7280;
  text-align: center;
`;

const ErrorText = styled.Text`
  margin-top: 8px;
  text-align: center;
  color: #ef4444;
  font-size: 13px;
  font-weight: 600;
`;

// Removed legacy manual upload controls; this screen auto-processes

const Footer = styled.View`
  padding: 16px 24px 24px 24px;
  align-items: center;
`;

// (no camera/upload boxes in processor UI)

const PreviewCard = styled.View`
  width: 90%;
  margin-top: 16px;
  border-radius: 16px;
  background-color: #ffffff;
  border-width: 1px;
  border-color: #e5e7eb;
  padding: 12px;
`;

const ImageWrap = styled.View`
  width: 100%;
  height: 260px;
  border-radius: 16px;
  overflow: hidden;
  background-color: #00000010;
`;

const StyledImage = styled(Image)`
  width: 100%;
  height: 100%;
`;

const TipCaption = styled.Text`
  margin-top: 8px;
  color: #6b7280;
  font-size: 12px;
`;

const ScanOverlay = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
`;

// Removed legacy full-screen overlay loader; replaced by scan beam + caption

const BottomBar = styled.View`
  width: 92%;
  padding: 10px;
  border-radius: 999px;
  background-color: #ffffff;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  shadow-color: #000000;
  shadow-opacity: 0.08;
  shadow-radius: 16px;
  shadow-offset: 0px 8px;
  elevation: 4;
`;

const LeftPill = styled.TouchableOpacity`
  height: 44px;
  width: 44px;
  border-radius: 22px;
  border-width: 1px;
  border-color: #e5e7eb;
  background-color: #ffffff;
  align-items: center;
  justify-content: center;
`;

const LeftPillEmoji = styled.Text`
  font-size: 20px;
`;

const RightPill = styled.TouchableOpacity<{ disabled?: boolean }>`
  height: 44px;
  flex: 1;
  margin-left: 12px;
  padding: 0 16px;
  border-radius: 22px;
  background-color: #6E56CF;
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  align-items: center;
  justify-content: center;
`;

const RightPillContent = styled.View`
  flex-direction: row;
  align-items: center;
`;

const RightPillIcon = styled.Text`
  color: #ffffff;
  font-size: 16px;
  margin-right: 8px;
`;

const RightPillText = styled.Text`
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
`;

const SheetOverlay = styled.TouchableOpacity`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: 0;
  background-color: rgba(0,0,0,0.25);
  justify-content: flex-end;
`;

const SheetCard = styled.TouchableOpacity`
  background-color: #ffffff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  padding: 16px;
`;

const SheetTitle = styled.Text`
  font-size: 16px;
  font-weight: 700;
  color: #111827;
`;

const ChipsRow = styled.View`
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const Chip = styled.TouchableOpacity<{ active?: boolean }>`
  flex-direction: row;
  align-items: center;
  margin-right: 8px;
  margin-bottom: 8px;
  padding: 10px 14px;
  border-radius: 999px;
  border-width: ${({ active }) => (active ? '0px' : '1px')};
  border-color: #e5e7eb;
  background-color: ${({ active }) => (active ? '#715DF2' : '#F3F4F6')};
`;

const ChipEmoji = styled.Text`
  margin-right: 6px;
`;

const ChipText = styled.Text<{ active?: boolean }>`
  color: ${({ active }) => (active ? '#ffffff' : '#374151')};
  font-size: 14px;
  font-weight: ${({ active }) => (active ? 800 : 600)};
`;

 


