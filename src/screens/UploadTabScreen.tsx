import React, { useRef } from 'react';
import styled from 'styled-components/native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { Animated, Pressable } from 'react-native';

export default function UploadTabScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();

  const onPick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.9, allowsEditing: false });
    if (!res.canceled) {
      navigation.navigate('ReviewUpload', { imageUri: res.assets[0].uri });
    }
  };

  return (
    <Wrap>
      <TopSpacer />
      <BrandIcon accessibilityLabel="RizzMate logo">💬</BrandIcon>
      <Brand>RizzMate</Brand>
      <Subtitle>Upload a chat screenshot to get an analysis.</Subtitle>

      <Animated.View style={{ transform: [{ scale }], width: '84%' }}>
        <Primary
          accessibilityRole="button"
          accessibilityLabel="Upload a screenshot from your library"
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={onPick}
        >
          <BtnEmoji>📸</BtnEmoji>
          <PrimaryText>Upload Screenshot</PrimaryText>
        </Primary>
      </Animated.View>

      <BottomSpacer />
    </Wrap>
  );
}

/* ===== styles ===== */

const Wrap = styled.SafeAreaView`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
  /* subtle background gradient via two layered views */
  background-color: #ffffff;
`;

const TopSpacer = styled.View`
  height: 32px;
`;

const BrandIcon = styled.Text`
  font-size: 40px;
  margin-bottom: 8px;
`;

const Brand = styled.Text`
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.2px;
`;

const Subtitle = styled.Text`
  color: #4b5563;
  font-size: 16px;
  text-align: center;
  margin: 8px 0 28px;
  max-width: 320px;
`;

const Primary = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  padding: 14px 18px;
  border-radius: 16px;
  /* gradient look using two layered colors (RN doesn't support CSS gradients in styled-components).
     Keep it simple and performant: solid color + shadow. Replace with expo-linear-gradient later if desired. */
  background-color: #6e56cf;
  shadow-color: #6e56cf;
  shadow-opacity: 0.35;
  shadow-radius: 10px;
  shadow-offset: 0px 6px;
  elevation: 6;
`;

const BtnEmoji = styled.Text`
  font-size: 18px;
  margin-right: 10px;
`;

const PrimaryText = styled.Text`
  color: #ffffff;
  font-size: 17px;
  font-weight: 700;
`;

const BottomSpacer = styled.View`
  height: 48px;
`;


