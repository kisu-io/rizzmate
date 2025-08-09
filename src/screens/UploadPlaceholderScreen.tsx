import React from 'react';
import styled from 'styled-components/native';

export default function UploadPlaceholderScreen(): React.ReactElement {
  return (
    <Container>
      <Text>Upload a screenshot from the middle button.</Text>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const Text = styled.Text`
  color: #6b7280;
`;


