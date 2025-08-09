import React, { useEffect, useState } from 'react';
import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import * as Clipboard from 'expo-clipboard';
import ToastMessage from 'react-native-toast-message';
import { bumpMetric, getMetrics } from '../storage/trending';
import { sortByTrending } from '../lib/trending';
import { lineId } from '../lib/hash';

type Category = 'All' | 'Funny' | 'Bold' | 'Cheesy' | 'Classic';

type PickupLine = {
  id: string;
  text: string;
  category: Category;
  emoji?: string;
  color?: string;
};

const CATEGORIES: { key: Category; emoji?: string }[] = [
  { key: 'All' },
  { key: 'Funny', emoji: '😂' },
  { key: 'Bold', emoji: '😏' },
  { key: 'Cheesy', emoji: '🧀' },
  { key: 'Classic', emoji: '📜' },
];

const PLACEHOLDER_LINES: PickupLine[] = [
  {
    id: '1',
    text: "Are you a magician? Because whenever I look at you, everyone else disappears.",
    category: 'Classic',
    emoji: '✨',
    color: '#0ea5e9',
  },
  {
    id: '2',
    text: "Do you have a name, or can I call you mine?",
    category: 'Bold',
    emoji: '🔥',
    color: '#ef4444',
  },
  {
    id: '3',
    text: "Are you a loan? Because you have my interest.",
    category: 'Funny',
    emoji: '😄',
    color: '#f59e0b',
  },
  {
    id: '4',
    text: "Do you believe in love at first swipe?",
    category: 'Cheesy',
    emoji: '🧀',
    color: '#a78bfa',
  },
];

export default function PickupLinesScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [selected, setSelected] = useState<Category>('All');
  const [lines, setLines] = useState<PickupLine[]>(PLACEHOLDER_LINES);
  // local trending order is loaded via metrics

  useEffect(() => {
    (async () => {
      const metrics = await getMetrics();
      setLines((prev) => sortByTrending(prev, metrics));
    })();
  }, []);

  const copyLine = async (text: string) => {
    await Clipboard.setStringAsync(text);
    ToastMessage.show({ type: 'success', text1: 'Copied! 🔥' });
    await bumpMetric(lineId(text), 'copies');
  };

  const onCardPress = async (text: string) => {
    await copyLine(text);
  };

  return (
    <Container>
      <HeaderBar>
        <BackButton accessibilityRole="button" accessibilityLabel="Go back" onPress={() => navigation.goBack()}>
          <BackIcon>‹</BackIcon>
        </BackButton>
      </HeaderBar>
      <Header>
        <Title>Pickup Lines Library</Title>
        <Subtitle>Steal one, tweak it, or get inspired. Tap to copy!</Subtitle>
      </Header>

      <CategoryScroll
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        <CategoryRow>
          {CATEGORIES.map(({ key: cat, emoji }) => {
            const isActive = selected === cat;
            return (
              <ChipPressable key={cat} onPress={() => setSelected(cat)}>
                {({ pressed }) => (
                  <CategoryChip
                    active={isActive}
                    style={{ transform: [{ scale: pressed ? 0.97 : 1 }], opacity: pressed ? 0.95 : 1 }}
                  >
                    {!!emoji && <ChipEmoji>{emoji}</ChipEmoji>}
                    <CategoryChipText active={isActive}>{cat}</CategoryChipText>
                  </CategoryChip>
                )}
              </ChipPressable>
            );
          })}
        </CategoryRow>
      </CategoryScroll>

      <List
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
      >
         {lines.map((item) => (
          <CardPressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel="Pickup line card"
             onPress={() => onCardPress(item.text)}
          >
            {({ pressed }) => (
              <Card style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }} accessibilityHint="Tap to copy">
                <Badge style={{ backgroundColor: (item.color ?? '#e5e7eb') + 'ee' }}>
                  <BadgeText>{item.emoji ?? '💬'}</BadgeText>
                  <BadgeLabel>{item.category}</BadgeLabel>
                </Badge>
                <LineText>
                  {item.text}
                </LineText>
              </Card>
            )}
          </CardPressable>
        ))}
      </List>

      <Footer>
        <LuckyPressable accessibilityRole="button" accessibilityLabel="Feeling Lucky button">
          {({ pressed }) => (
            <LuckyButton style={{ transform: [{ scale: pressed ? 0.98 : 1 }] }}>
              <LuckyText>🎲 Feeling Lucky?</LuckyText>
            </LuckyButton>
          )}
        </LuckyPressable>
      </Footer>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #fafbfc;
`;

const Header = styled.View`
  padding: 16px 16px 8px 16px;
  align-items: center;
`;

const HeaderBar = styled.View`
  padding: 12px 8px 0 8px;
`;

const BackButton = styled.TouchableOpacity`
  padding: 8px 12px;
`;

const BackIcon = styled.Text`
  font-size: 20px;
  color: #111827;
`;

const Title = styled.Text`
  margin-top: 4px;
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  text-align: center;
`;

const Subtitle = styled.Text`
  margin-top: 6px;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
`;

const CategoryScroll = styled.ScrollView`
  margin-top: 8px;
`;

const CategoryRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ChipPressable = styled(Pressable)`
  margin-right: 10px;
`;

const CategoryChip = styled.View<{ active?: boolean }>`
  padding: 9px 16px;
  border-radius: 999px;
  background-color: ${({ active }) => (active ? '#111827' : '#f3f4f6')};
  border-width: 1px;
  border-color: ${({ active }) => (active ? '#0f172a' : '#e5e7eb')};
  flex-direction: row;
  align-items: center;
  shadow-color: #000000;
  shadow-opacity: ${({ active }) => (active ? 0.08 : 0)};
  shadow-radius: 10px;
  shadow-offset: 0px 4px;
  elevation: ${({ active }) => (active ? 2 : 0)};
`;

const CategoryChipText = styled.Text<{ active?: boolean }>`
  color: ${({ active }) => (active ? '#ffffff' : '#374151')};
  font-size: 14px;
  font-weight: 700;
`;

const ChipEmoji = styled.Text`
  margin-right: 6px;
  font-size: 14px;
`;

const List = styled.ScrollView`
  flex: 1;
  margin-top: 12px;
`;

const CardPressable = styled(Pressable)`
  margin-bottom: 16px;
`;

const Card = styled.View`
  padding: 18px 18px 22px 18px;
  border-radius: 16px;
  background-color: #F8F9FB;
  shadow-color: #000000;
  shadow-opacity: 0.07;
  shadow-radius: 14px;
  shadow-offset: 0px 6px;
  elevation: 3;
`;

const LineText = styled.Text`
  color: #111827;
  font-size: 18px;
  line-height: 26px;
`;

const Badge = styled.View`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  flex-direction: row;
  align-items: center;
`;

const BadgeText = styled.Text`
  margin-right: 6px;
  font-size: 13px;
`;

const BadgeLabel = styled.Text`
  color: #ffffff;
  font-size: 12px;
  font-weight: 700;
`;

const Footer = styled.View`
  padding: 8px 16px 20px 16px;
  align-items: center;
`;

const LuckyPressable = styled(Pressable)`
  width: 100%;
  align-items: center;
`;

const LuckyButton = styled.View`
  width: 92%;
  min-height: 52px;
  padding: 14px 16px;
  border-radius: 18px;
  background-color: #6c5ce7;
  align-items: center;
  justify-content: center;
  shadow-color: #000000;
  shadow-opacity: 0.1;
  shadow-radius: 14px;
  shadow-offset: 0px 8px;
  elevation: 4;
`;

const LuckyText = styled.Text`
  color: #ffffff;
  font-size: 16px;
  font-weight: 800;
`;

// removed custom toast overlay in favor of global ToastMessage


