import React, {useCallback, useEffect, useState} from 'react';
import HeadlineContainer from '../common/HeadlineContainer/HeadlineContainer';
import {Column, FlexGrid, Row} from '@carbon/react';
import TextInput from '../common/TextInput/TextInput';
import SocketIOComponent from '../common/SocketIOComponent/SocketIOComponent';
import {get, post} from '../../utils/netowrkUtils';
import {cloneDeep, debounce, isEqual} from 'lodash';
import {collections} from '../../shared';

const heroesAPIPath = '/api/game/1/heroes/';

const initialState = ['','','','','',''];

const NameTextInput = ({index, heroes, onHeroNameChange}) => <TextInput value={heroes[index]} onChange={(changeEvent) => onHeroNameChange(changeEvent?.target?.value, index, heroes)} />;

const Heroes = () => {

  const [heroes, setHeroes] = useState(initialState);

  const shapeHeroesResponse = (response) => response?.heroes || initialState;

  const debouncePost = useCallback(debounce(post, 250), []);

  useEffect(() => {
    get(heroesAPIPath).then(response => setHeroes(shapeHeroesResponse(response)));
  },
  []);

  const onHeroNameChange = async (hero, index, heroesList) => {
    const newHeroesList = cloneDeep(heroesList);
    newHeroesList[index] = hero;
    setHeroes(newHeroesList);
    debouncePost(heroesAPIPath, {heroes: newHeroesList});
  };

  const onHeroUpdateEventReceived = (heroUpdateEvent) => {
    if (!isEqual(heroes, heroUpdateEvent)) setHeroes(shapeHeroesResponse(heroUpdateEvent));
  };

  return (
    <SocketIOComponent
      callback={onHeroUpdateEventReceived}
      channel={collections.HEROES}
    >
      <HeadlineContainer headLine={'Heroes'}>
        <FlexGrid>
          <Row>
            <Column>
              <NameTextInput index={0} heroes={heroes} onHeroNameChange={onHeroNameChange} />
            </Column>
            <Column>
              <NameTextInput index={1} heroes={heroes} onHeroNameChange={onHeroNameChange} />
            </Column>
          </Row>
          <Row>
            <Column>
              <NameTextInput index={2} heroes={heroes} onHeroNameChange={onHeroNameChange} />
            </Column>
            <Column>
              <NameTextInput index={3} heroes={heroes} onHeroNameChange={onHeroNameChange} />
            </Column>
          </Row>
          <Row>
            <Column>
              <NameTextInput index={4} heroes={heroes} onHeroNameChange={onHeroNameChange} />
            </Column>
            <Column>
              <NameTextInput index={5} heroes={heroes} onHeroNameChange={onHeroNameChange} />
            </Column>
          </Row>
        </FlexGrid>
      </HeadlineContainer>
    </SocketIOComponent>
  );
};

export default Heroes;
