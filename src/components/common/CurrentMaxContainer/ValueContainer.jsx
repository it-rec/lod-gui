import React from 'react';
import styles from './ValueContainer.module.scss';
import TextInput from '../TextInput/TextInput';

const ValueContainer = ({current, setCurrent = () => void(0), max, setMax = () => void(0)}) => {
  return (
    <div className={styles.currentMaxContainer}>
      <TextInput value={current} onChange={(changeEvent) => setCurrent(changeEvent?.target?.value)} />
      {max && (
        <TextInput value={max} onChange={(changeEvent) => setMax(changeEvent?.target?.value)} />
      )}
    </div>
  );
};

export default ValueContainer;
