import React from 'react';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import * as ImagePicker from 'expo-image-picker';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen(): React.ReactElement {
  const navigation = useNavigation<Nav>();
  async function startUploadFlow(): Promise<void> {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.9, base64: false, allowsMultipleSelection: false, mediaTypes: ImagePicker.MediaTypeOptions.Images });
      if (res.canceled) return;
      const uri = res.assets?.[0]?.uri;
      if (!uri) return;
      navigation.navigate('ReviewUpload', { imageUri: uri });
    } catch {
      // silent fail; user can try again
    }
  }

  return (
    <Container>
      <Content>
        <Title>RizzMate</Title>
        <Subtitle>Your AI wingman, private & smooth.</Subtitle>

        <PrimaryButton activeOpacity={0.85} onPress={startUploadFlow}>
          <PrimaryText>📸 Upload Screenshot</PrimaryText>
        </PrimaryButton>

        <SecondaryButton
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Tabs', { screen: 'TextTab' })}
        >
          <SecondaryText>Enter Text Manually</SecondaryText>
        </SecondaryButton>

        <GhostButton activeOpacity={0.85} onPress={() => navigation.navigate('Tabs', { screen: 'PickupTab' })}>
          <GhostButtonText>See Pickup Lines</GhostButtonText>
        </GhostButton>

      </Content>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #fafafa;
  align-items: center;
`;

const Content = styled.View`
  flex: 1;
  width: 100%;
  padding: 24px;
  align-items: center;
  justify-content: center;
`;

const Title = styled.Text`
  font-size: 32px;
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

const PrimaryButton = styled.TouchableOpacity`
  width: 80%;
  min-height: 56px;
  padding: 14px 16px;
  border-radius: 14px;
  background-color: #6c5ce7;
  align-items: center;
  justify-content: center;
  margin-top: 24px;
`;

const PrimaryText = styled.Text`
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
  margin-top: 16px;
`;

const SecondaryText = styled.Text`
  color: #4f46e5;
  font-size: 16px;
  font-weight: 700;
`;

const GhostButton = styled.TouchableOpacity`
  width: 80%;
  min-height: 50px;
  padding: 12px 14px;
  border-radius: 12px;
  border-width: 1px;
  border-color: #d1d5db;
  background-color: #ffffff;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
`;

const GhostButtonText = styled.Text`
  color: #374151;
  font-size: 16px;
  font-weight: 600;
`;

 


