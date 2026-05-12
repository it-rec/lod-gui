import React, { useState, useEffect } from 'react';
import HeadlineContainer from '../common/HeadlineContainer/HeadlineContainer';
import classNames from 'classnames';
import styles from './StoryPoints.module.scss';
import _, {isEmpty} from 'lodash';
import { post, get } from '../../utils/netowrkUtils';
import socketIOClient from 'socket.io-client';
import {isEqual} from 'lodash/lang';
import { collections } from '../../shared';

const storyPointAPIPath = `/api/game/1/${collections.STORY_POINTS}/`;

const StoryPoint = ({label, className, isActive, onActivate}) => {
  return (
    <div 
      className={classNames({
        [styles.isActive]: isActive,
        [styles.storyPoints]: true,
        [className]: true
      })}
      onClick={() => onActivate(label)}
    >
      {label}
    </div>
  );
};

const StoryPoints = () => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'U', 'V', 'W', 'X', 'Y', 'Z'];

  const [storyPoints, setStoryPoints] = useState([]);
  const [storyParts, setStoryParts] = useState([]);
  const [socket, setSocket] = useState();

  const generateInitialStoryPoints = () => {
    const generatedStoryPoints = [];
    letters.forEach((letter) => {
      for (let n = 1; n < 9; n++) {
        generatedStoryPoints.push({
          label: `${letter}${n}`,
          isDone: false
        });
      }
    });
    return generatedStoryPoints;
  };

  useEffect(() => {
    get(storyPointAPIPath)
      .then(loadedStoryPoints => {
        if (!isEmpty(loadedStoryPoints)) {
          setStoryPoints(loadedStoryPoints);
        }
        else {
          if (isEmpty(storyPoints)) setStoryPoints(generateInitialStoryPoints());
        }
      });
    setSocket(socketIOClient());

    return () => {
      socket?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('connect_error', (error) => {
        console.error('error');
        console.error(error);
      });
      socket.on(collections.STORY_POINTS, (storyPointsEvent) => {
        setStoryPoints(storyPointsEvent);
      });
    }
  }, [socket]);

  useEffect(() => {
    const currentStoryParts = [];

    let index = -1;
    for (let i = 0; i < storyPoints.length; i++) {
      if (i % 8 === 0) {
        index++;
        currentStoryParts[index] = [];
      }
      currentStoryParts[index].push(storyPoints[i]);
    }

    if (!isEqual(storyParts, currentStoryParts) && !isEqual(storyPoints, generateInitialStoryPoints())) {
      post(storyPointAPIPath, storyPoints);
    }

    setStoryParts(currentStoryParts);
  }, [storyPoints]);

  const onActivate = (label) => {
    const storyPoint = storyPoints.filter((storyPoint) => _.isEqual(storyPoint.label, label)).shift();

    const storyPointsCopy = [...storyPoints];
    const storyPointCopy = {...storyPoint};
    storyPointCopy.isDone = !storyPoint.isDone;

    storyPointsCopy.splice(storyPoints.indexOf(storyPoint), 1, storyPointCopy);
    setStoryPoints(storyPointsCopy);
  };

  return (
    <HeadlineContainer headLine={'Story Points'}>
      <div className={styles.storyPointWrapper}>
        {storyParts.map((storyPart, index) => {
          return (
            <div key={index}>
              {storyPart.map((storyPoint) => {
                return (
                  <StoryPoint
                    label={storyPoint.label}
                    className={styles.topLeft}
                    isActive={storyPoint.isDone}
                    onActivate={onActivate}
                    key={storyPoint.label}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </HeadlineContainer>
  );
};

export default StoryPoints;