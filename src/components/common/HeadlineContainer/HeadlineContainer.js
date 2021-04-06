import React from 'react';
import styles from './HeadlineContainer.module.scss';

const HeadLine = ({headLine, hasMaximum }) => (
  <div className={styles.headline}>
    <div className={styles.label}>
      {headLine}
    </div>

    <div className={styles.maximumLabel}>
      {hasMaximum ? 'Maximum' : undefined}
    </div>
  </div>
);


const HeadlineContainer = ({headLine, hasMaximum, children}) => {
  return (
    <div className={styles.headlineContainer}>
      <HeadLine headLine={headLine} hasMaximum={hasMaximum}/>
      <div>
        {children}
      </div>
    </div>
  );
};

export default HeadlineContainer;