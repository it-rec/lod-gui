import React from 'react';
import HeadlineContainer from '../common/HeadlineContainer/HeadlineContainer';
import {Column, Grid, Row} from 'carbon-components-react';
import TextInput from '../common/TextInput/TextInput';

const Heroes = () => {
  const heroes = [
    '',
    '',
    '',
    '',
    '',
    ''
  ];

  const onHeroNameChange = (hero) => {
    console.log(hero);
  };

  const NameTextInput = (index) => (
    <TextInput value={heroes[index]} onChange={(changeEvent) => onHeroNameChange(changeEvent, index)} />
  );

  return (
    <HeadlineContainer headLine={'Heroes'}>
      <Grid>
        <Row>
          <Column>
            <NameTextInput index={0} />
          </Column>
          <Column>
            <NameTextInput index={1} />
          </Column>
        </Row>
        <Row>
          <Column>
            <NameTextInput index={2} />
          </Column>
          <Column>
            <NameTextInput index={3} />
          </Column>
        </Row>
        <Row>
          <Column>
            <NameTextInput index={4} />
          </Column>
          <Column>
            <NameTextInput index={5} />
          </Column>
        </Row>
      </Grid>
    </HeadlineContainer>
  );
};

export default Heroes;