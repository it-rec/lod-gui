import cx from 'classnames';
import styles from './Button.module.scss';

// Themed button. `kind` picks the visual treatment, `iconOnly` makes it a
// square icon button. Any other props (onClick, disabled, aria-*) pass through.
const Button = ({
  kind = 'primary',
  size = 'md',
  iconOnly = false,
  type = 'button',
  className,
  children,
  ...rest
}) => (
  <button
    type={type}
    className={cx(
      styles.button,
      styles[kind],
      styles[size],
      { [styles.iconOnly]: iconOnly },
      className
    )}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
