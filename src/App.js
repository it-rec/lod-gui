import './App.scss';
import React from 'react';
import {Column, Grid, Row} from 'carbon-components-react';
import Gold from './components/Gold/Gold';
import Fame from './components/Fame/Fame';
import Heroes from './components/Heroes/Heroes';
import StoryPoints from './components/StoryPoints/StoryPoints';

function App() {
  return (
    <div className={'root'}>
      <Grid className={'App'}>
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
      </Grid>
    </div>
  );
}

export default App;
