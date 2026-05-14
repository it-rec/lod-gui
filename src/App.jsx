import './App.scss';
import React from 'react';
import {Column, FlexGrid, Row} from '@carbon/react';
import Gold from './components/Gold/Gold';
import Fame from './components/Fame/Fame';
import Heroes from './components/Heroes/Heroes';
import StoryPoints from './components/StoryPoints/StoryPoints';

function App() {
  return (
    <div className={'root'}>
      <FlexGrid className={'App'}>
        <Row>
          <Column lg={6}>
            <Heroes />
          </Column>
          <Column lg={3}>
            <Fame />
          </Column>
          <Column lg={3}>
            <Gold />
          </Column>
        </Row>
        <Row>
          <Column>
            <StoryPoints />
          </Column>
        </Row>
      </FlexGrid>
    </div>
  );
}

export default App;
