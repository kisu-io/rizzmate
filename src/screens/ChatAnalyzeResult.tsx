import React from 'react';
import styled from 'styled-components/native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';

export default function ChatAnalyzeResult(): React.ReactElement {
  const route = useRoute<RouteProp<RootStackParamList,'ChatAnalyzeResult'>>();
  const { stats, summary } = route.params;
  return (
    <Wrap>
      <Title>Compatibility Insights</Title>
      <Summary>{summary}</Summary>

      <Card>
        <CardTitle>Message Count</CardTitle>
        <BarRow>
          <BarLabel>You</BarLabel>
          <Bar><Fill style={{ width: `${pct(stats.youCount, stats.youCount + stats.themCount)}%` }} /></Bar>
        </BarRow>
        <BarRow>
          <BarLabel>Them</BarLabel>
          <Bar><Fill2 style={{ width: `${pct(stats.themCount, stats.youCount + stats.themCount)}%` }} /></Bar>
        </BarRow>
      </Card>

      <Card>
        <CardTitle>Interest Level</CardTitle>
        <Row>
          <Pill>You: {stats.youInterest}%</Pill>
          <Pill secondary>Them: {stats.themInterest}%</Pill>
        </Row>
      </Card>

      <Card>
        <CardTitle>Meaningful Words</CardTitle>
        <Row>
          <Col>
            <Label>You</Label>
            {stats.youWords.map(w => <Badge key={`y-${w}`}>{w}</Badge>)}
          </Col>
          <Col>
            <Label>Them</Label>
            {stats.themWords.map(w => <Badge key={`t-${w}`}>{w}</Badge>)}
          </Col>
        </Row>
      </Card>

      <Card>
        <CardTitle>Signals</CardTitle>
        <Label>Green Flags</Label>
        <WrapRow>{stats.greenFlags.map(w => <Green key={`g-${w}`}>{w}</Green>)}</WrapRow>
        <Label style={{ marginTop: 8 }}>Red Flags</Label>
        <WrapRow>{stats.redFlags.map(w => <Red key={`r-${w}`}>{w}</Red>)}</WrapRow>
      </Card>

      <Card>
        <CardTitle>Attachment Style</CardTitle>
        <Row>
          <Pill>You: {stats.attachmentYou}</Pill>
          <Pill secondary>Them: {stats.attachmentThem}</Pill>
        </Row>
      </Card>

      <Card>
        <CardTitle>Compatibility</CardTitle>
        <Big>{stats.compatibility}%</Big>
      </Card>
    </Wrap>
  );
}

function pct(n: number, d: number){ return d ? Math.round((n/d)*100) : 0; }

const Wrap = styled.ScrollView`
  flex: 1; background: #fff; padding: 16px;
`;
const Title = styled.Text`
  font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 6px;
`;
const Summary = styled.Text`
  color: #374151; margin-bottom: 12px;
`;
const Card = styled.View`
  background: #F9FAFB; border-radius: 12px; padding: 12px; margin-bottom: 12px;
`;
const CardTitle = styled.Text`
  font-weight: 800; color: #111827; margin-bottom: 8px;
`;
const Row = styled.View`
  flex-direction: row; align-items: center; justify-content: space-between;
`;
const Col = styled.View`
  flex: 1;
`;
const BarRow = styled.View`
  flex-direction: row; align-items: center; margin-bottom: 6px;
`;
const BarLabel = styled.Text`
  width: 54px; color: #374151;
`;
const Bar = styled.View`
  flex: 1; height: 10px; background: #E5E7EB; border-radius: 6px; overflow: hidden;
`;
const Fill = styled.View`
  height: 10px; background: #6EE7B7;
`;
const Fill2 = styled(Fill)`
  background: #93C5FD;
`;
const Pill = styled.Text<{ secondary?: boolean }>`
  padding: 8px 12px; background: ${({secondary})=>secondary?'#E0E7FF':'#DCFCE7'}; color: #111827; border-radius: 999px; font-weight: 700;
`;
const Label = styled.Text`
  color: #6B7280; font-weight: 700; margin-bottom: 4px;
`;
const Badge = styled.Text`
  padding: 6px 10px; background: #EEF2FF; color: #4F46E5; border-radius: 999px; margin-right: 6px; margin-bottom: 6px; font-weight: 700;
`;
const WrapRow = styled.View`
  flex-direction: row; flex-wrap: wrap;
`;
const Green = styled(Badge)`
  background: #DCFCE7; color: #065F46;
`;
const Red = styled(Badge)`
  background: #FEE2E2; color: #991B1B;
`;
const Big = styled.Text`
  font-size: 40px; font-weight: 800; color: #111827; text-align: center;
`;

