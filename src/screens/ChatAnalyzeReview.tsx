import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components/native';
import { Animated, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { runOCR } from '../ocr/ocr';
import { analyzeCompatibility } from '../services/compatibility';
import type { RootStackParamList } from '../navigation/types';
import * as Haptics from 'expo-haptics';

type R = RouteProp<RootStackParamList,'ChatAnalyzeReview'>;

export default function ChatAnalyzeReview(): React.ReactElement {
  const route = useRoute<R>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { imageUri } = route.params;
  const [loading, setLoading] = useState(true);
  const [ocrText, setOcrText] = useState('');
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
    let alive = true;
    (async () => {
      try {
        const scaled = await ImageManipulator.manipulateAsync(imageUri, [{ resize: { width: 1280 } }], { compress: 0.9 });
        const text = (await runOCR(scaled.uri)).trim();
        if (!alive) return;
        setOcrText(text);
      } catch {
        if (!alive) return;
        setOcrText('');
        Toast.show({ type: 'info', text1: 'OCR had trouble', text2: 'You can still analyze.' });
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [imageUri]);

  const onAnalyze = async () => {
    if (loading) return;
    try {
      await Haptics.selectionAsync();
      const { stats, summary } = await analyzeCompatibility(ocrText);
      navigation.navigate('ChatAnalyzeResult', { imageUri, stats, summary });
    } catch (e:any) {
      Toast.show({ type:'error', text1:'Analyze failed', text2: String(e?.message || 'Try again') });
    }
  };

  return (
    <Wrap>
      <ImageWrap>
        <StyledImage source={{ uri: imageUri }} resizeMode="contain" />
        {loading && (
          <ScanOverlay pointerEvents="none">
            <Animated.View style={{ position: 'absolute', left: 0, right: 0, transform: [{ translateY: scanAnim.interpolate({ inputRange:[0,1], outputRange:[0, 240] }) }] }}>
              <LinearGradient colors={[ 'transparent', 'rgba(255,255,255,0.35)', 'transparent' ]} style={{ height: 56, width: '100%' }} />
            </Animated.View>
          </ScanOverlay>
        )}
      </ImageWrap>

      <Caption>{loading ? 'Reading your chat… all on your device 🔒' : 'Ready to analyze compatibility.'}</Caption>

      <Primary disabled={loading} onPress={onAnalyze} accessibilityLabel="Analyze compatibility">
        {loading ? <ActivityIndicator color="#fff" /> : <PrimaryText>Analyze Compatibility</PrimaryText>}
      </Primary>
    </Wrap>
  );
}

const Wrap = styled.SafeAreaView`
  flex: 1; padding: 16px; background: #fff; align-items: center;
`;
const ImageWrap = styled.View`
  width: 100%; height: 320px; border-radius: 16px; overflow: hidden; background: #0001; margin-top: 8px;
`;
const StyledImage = styled(Image)`
  width: 100%; height: 100%;
`;
const ScanOverlay = styled.View`
  position: absolute; left: 0; right: 0; top: 0; bottom: 0;
`;
const Caption = styled.Text`
  margin: 10px 0; color: #6b7280;
`;
const Primary = styled.TouchableOpacity<{ disabled?: boolean }>`
  height: 52px; width: 92%; border-radius: 16px; align-items: center; justify-content: center; background: #6E56CF; opacity: ${({disabled})=>disabled?0.6:1};
`;
const PrimaryText = styled.Text`
  color: #fff; font-weight: 800;
`;

