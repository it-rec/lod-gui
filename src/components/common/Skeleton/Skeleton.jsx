import cx from 'classnames';
import styles from './Skeleton.module.scss';

// A shimmering placeholder block shown while a panel loads its data.
const Skeleton = ({ width, height, radius, className, style }) => (
  <span
    className={cx(styles.skeleton, className)}
    style={{ width, height, borderRadius: radius, ...style }}
    aria-hidden="true"
  />
);

export default Skeleton;
