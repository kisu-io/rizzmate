import React from 'react';
import styled from 'styled-components/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import * as ImagePicker from 'expo-image-picker';

export default function InsightsTabScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const onPickAnalyze = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.9, allowsEditing: false });
    if (!res.canceled && res.assets?.[0]?.uri) {
      navigation.navigate('ChatAnalyzeReview', { imageUri: res.assets[0].uri });
    }
  };

  return (
    <Wrap>
      <Title>Insights</Title>
      <Card activeOpacity={0.9} onPress={onPickAnalyze} accessibilityLabel="Analyze chat compatibility">
        <Emoji>📊</Emoji>
        <CardText>Chat Compatibility</CardText>
      </Card>
      <Card activeOpacity={0.9} onPress={() => navigation.navigate('PickupLibrary')} accessibilityLabel="Open pickup lines library">
        <Emoji>✨</Emoji>
        <CardText>Pickup Line Library</CardText>
      </Card>
    </Wrap>
  );
}

const Wrap = styled.SafeAreaView`
  flex: 1;
  padding: 24px;
  background: #fff;
`;
const Title = styled.Text`
  font-size: 24px; font-weight: 800; color: #111827; margin-bottom: 16px;
`;
const Card = styled.TouchableOpacity`
  flex-direction: row; align-items: center; padding: 16px; border-radius: 16px; background: #F3F4F6; margin-bottom: 12px;
`;
const Emoji = styled.Text`
  font-size: 20px; margin-right: 10px;
`;
const CardText = styled.Text`
  font-size: 16px; font-weight: 700; color: #111827;
`;

