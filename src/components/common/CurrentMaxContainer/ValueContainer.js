import React from 'react';
import styles from './ValueContainer.module.scss';
import _ from 'lodash';

const ValueContainer = ({current, setCurrent = () => void(0), max, setMax = () => void(0)}) => {
  return (
    <div className={styles.currentMaxContainer}>
      <div className={styles.valueBox} contentEditable={'true'} onInput={(e) => setCurrent(e.currentTarget.textContent)}>
        {_.cloneDeep(current ? current : 0)}
      </div>
      {max && (
        <div className={styles.maxBox} contentEditable={'true'} onInput={(e) => setMax(e.currentTarget.textContent)}>
          {_.cloneDeep(_.isEmpty(max) ? max : 0)}
        </div>
      )}
    </div>
  );
};

export default ValueContainer;