import cx from 'classnames';
import styles from './TextInput.module.scss';

// A parchment-styled inline text input. `variant` controls size/emphasis;
// all other props (value, onChange, placeholder, list, maxLength, aria-*)
// pass straight through to the underlying <input>.
const TextInput = ({ variant = 'default', className, ...rest }) => (
  <input
    type="text"
    className={cx(styles.textInput, styles[variant], className)}
    {...rest}
  />
);

export default TextInput;
