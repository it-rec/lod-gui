import React from 'react';
import styles from './TextInput.module.scss';

const TextInput = ({value, onChange}) => {
  return (
    <input value={value} onChange={onChange} className={styles.textInput} />
  );
};

export default TextInput;
