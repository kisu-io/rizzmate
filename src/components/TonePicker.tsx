import React, { useMemo, useRef } from 'react';
import styled from 'styled-components/native';
import { Animated, FlatList, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { Tone } from '../navigation/types';

export type TonePick = Tone | 'Surprise';

type ToneMeta = {
  key: TonePick;
  emoji: string;
  label: string;
  tagline: string;
  colors: { idleBg: string; activeBg: string; border: string };
};

const TONES: ToneMeta[] = [
  {
    key: 'Flirty',
    emoji: '😏',
    label: 'Flirty',
    tagline: 'Certified smooth operator',
    colors: { idleBg: '#F2F4F7', activeBg: '#FFE1F0', border: '#FFB5D0' },
  },
  {
    key: 'Polite',
    emoji: '🙏',
    label: 'Polite',
    tagline: 'Yes ma’am, no ma’am',
    colors: { idleBg: '#F2F4F7', activeBg: '#E8F0FF', border: '#BBD3FF' },
  },
  {
    key: 'Funny',
    emoji: '😁',
    label: 'Funny',
    tagline: 'Pun intended',
    colors: { idleBg: '#F2F4F7', activeBg: '#FFF4CC', border: '#FFD782' },
  },
  {
    key: 'Direct',
    emoji: '🫡',
    label: 'Direct',
    tagline: 'Straight shooter',
    colors: { idleBg: '#F2F4F7', activeBg: '#FFE8DC', border: '#FFBEA1' },
  },
  {
    key: 'Witty',
    emoji: '🤓',
    label: 'Witty',
    tagline: 'Brainy banter',
    colors: { idleBg: '#F2F4F7', activeBg: '#F1EDFF', border: '#C7C2FF' },
  },
  {
    key: 'Surprise',
    emoji: '🎲',
    label: 'Surprise Me',
    tagline: 'Wild card energy',
    colors: { idleBg: '#F2F4F7', activeBg: '#E9FBEE', border: '#B8F4C7' },
  },
];

export function useToneList(): ToneMeta[] {
  return useMemo(() => TONES, []);
}

export default function TonePicker({
  selected,
  onSelect,
}: {
  selected: TonePick | null;
  onSelect: (tone: TonePick) => void;
}): React.ReactElement {
  const scales = useRef(new Map<TonePick, Animated.Value>()).current;
  if (scales.size === 0) {
    TONES.forEach((t) => scales.set(t.key, new Animated.Value(1)));
  }

  const handlePress = (tone: TonePick) => {
    onSelect(tone);
    Haptics.selectionAsync();
    const v = scales.get(tone);
    if (v) {
      Animated.sequence([
        Animated.timing(v, { toValue: 1.08, duration: 120, useNativeDriver: true }),
        Animated.spring(v, { toValue: 1, useNativeDriver: true }),
      ]).start();
    }
  };

  const renderItem = ({ item }: { item: ToneMeta }) => {
    const isActive = selected === item.key;
    const scale = scales.get(item.key) ?? new Animated.Value(1);
    return (
      <TonePressable
        accessibilityRole="button"
        accessibilityLabel={`Select tone: ${item.label}`}
        onPress={() => handlePress(item.key)}
        onLongPress={() => handlePress(item.key)}
      >
        <AnimatedCard
          style={{ transform: [{ scale }] }}
          active={isActive}
          activeBg={item.colors.activeBg}
          idleBg={item.colors.idleBg}
          borderColor={item.colors.border}
        >
          <Emoji>{item.emoji}</Emoji>
          <Label active={isActive}>{item.label}</Label>
          <Tagline>{item.tagline}</Tagline>
        </AnimatedCard>
      </TonePressable>
    );
  };

  return (
    <Grid
      data={TONES}
      keyExtractor={(i) => `${i.key}`}
      renderItem={renderItem}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
      contentContainerStyle={{ paddingVertical: 8 }}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    />
  );
}

const Grid = styled(FlatList as new () => FlatList<ToneMeta>)``;

const TonePressable = styled(Pressable)`
  width: 48%;
  margin-bottom: 12px;
`;

const Card = styled.View<{
  active?: boolean;
  activeBg: string;
  idleBg: string;
  borderColor: string;
}>`
  padding: 12px;
  border-radius: 16px;
  background-color: ${({ active, activeBg, idleBg }) => (active ? activeBg : idleBg)};
  border-width: 1px;
  border-color: ${({ borderColor }) => borderColor};
  align-items: center;
  justify-content: center;
  shadow-color: #000000;
  shadow-opacity: ${({ active }) => (active ? 0.08 : 0)};
  shadow-radius: 12px;
  shadow-offset: 0px 6px;
`;

const AnimatedCard = Animated.createAnimatedComponent(Card);

const Emoji = styled.Text`
  font-size: 24px;
`;

const Label = styled.Text<{ active?: boolean }>`
  margin-top: 6px;
  font-size: 14px;
  font-weight: 800;
  color: #1f2937;
`;

const Tagline = styled.Text`
  margin-top: 2px;
  font-size: 11px;
  color: #6b7280;
  text-align: center;
`;


