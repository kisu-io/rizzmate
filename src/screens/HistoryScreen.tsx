import React, { useCallback, useState } from 'react';
import styled from 'styled-components/native';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { Alert, ActivityIndicator, FlatList, ListRenderItemInfo } from 'react-native';
import type { HistoryItem } from '../navigation/types';
import { deleteHistoryItem, getHistory } from '../storage/history';

function formatDateLabel(ts: number): string {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function HistoryScreen(): React.ReactElement {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getHistory();
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <Container>
      <Content>
        <Title>Saved Replies</Title>
        <Subtitle>Review your past AI-generated messages.</Subtitle>

        {loading ? (
          <LoadingWrap>
            <ActivityIndicator />
          </LoadingWrap>
        ) : items.length > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            renderItem={({ item }: ListRenderItemInfo<HistoryItem>) => (
              <Card>
                <MessagePreview numberOfLines={3}>{item.text}</MessagePreview>
                <CardFooter>
                  <DateLabel>{formatDateLabel(item.createdAt)}</DateLabel>
                  <Actions>
                    <CopySmallButton
                      activeOpacity={0.85}
                      accessibilityLabel="Copy saved reply"
                      disabled={busyId === item.id}
                      onPress={async () => {
                        if (busyId) return;
                        setBusyId(item.id);
                        try {
                          await Clipboard.setStringAsync(item.text);
                          Toast.show({ type: 'success', text1: 'Copied!', text2: 'Message copied to clipboard.' });
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    >
                      <CopySmallText>{busyId === item.id ? '...' : 'Copy'}</CopySmallText>
                    </CopySmallButton>
                    <IconButton
                      activeOpacity={0.85}
                      accessibilityLabel="Delete saved reply"
                      disabled={busyId === item.id}
                      onPress={() => {
                        if (busyId) return;
                        Alert.alert('Delete reply', 'Are you sure you want to delete this reply?', [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: async () => {
                              setBusyId(item.id);
                              try {
                                await deleteHistoryItem(item.id);
                                await load();
                                Toast.show({ type: 'success', text1: 'Deleted', text2: 'Item removed from history.' });
                              } finally {
                                setBusyId(null);
                              }
                            },
                          },
                        ]);
                      }}
                    >
                      <IconText>🗑️</IconText>
                    </IconButton>
                  </Actions>
                </CardFooter>
              </Card>
            )}
          />
        ) : (
          <EmptyState>
            <EmptyEmoji>📭</EmptyEmoji>
            <EmptyTitle>No saved replies yet.</EmptyTitle>
            <EmptyCaption>Your saved messages will appear here.</EmptyCaption>
          </EmptyState>
        )}
      </Content>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #ffffff;
`;

const Content = styled.View`
  flex: 1;
`;

const Title = styled.Text`
  margin-top: 8px;
  font-size: 24px;
  font-weight: 800;
  color: #111827;
  text-align: center;
`;

const Subtitle = styled.Text`
  margin-top: 6px;
  font-size: 16px;
  color: #6b7280;
  text-align: center;
`;

const List = styled.ScrollView`
  margin-top: 16px;
`;

const LoadingWrap = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const Card = styled.View`
  width: 100%;
  background-color: #ffffff;
  border-width: 1px;
  border-color: #e5e7eb;
  border-radius: 16px;
  padding: 16px;
  margin-top: 12px;
`;

const MessagePreview = styled.Text`
  color: #111827;
  font-size: 16px;
  line-height: 22px;
`;

const CardFooter = styled.View`
  margin-top: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const DateLabel = styled.Text`
  color: #6b7280;
  font-size: 13px;
`;

const Actions = styled.View`
  flex-direction: row;
  align-items: center;
`;

const CopySmallButton = styled.TouchableOpacity`
  padding: 8px 12px;
  border-radius: 999px;
  background-color: #6c5ce7;
  align-items: center;
  justify-content: center;
`;

const CopySmallText = styled.Text`
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
`;

const IconButton = styled.TouchableOpacity`
  margin-left: 10px;
  height: 36px;
  width: 36px;
  border-radius: 18px;
  background-color: #f3f4f6;
  align-items: center;
  justify-content: center;
`;

const IconText = styled.Text`
  font-size: 16px;
`;

const EmptyState = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const EmptyEmoji = styled.Text`
  font-size: 48px;
`;

const EmptyTitle = styled.Text`
  margin-top: 12px;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  text-align: center;
`;

const EmptyCaption = styled.Text`
  margin-top: 6px;
  font-size: 14px;
  color: #6b7280;
  text-align: center;
`;



