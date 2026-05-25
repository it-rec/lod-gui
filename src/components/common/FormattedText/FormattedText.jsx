import { Fragment } from 'react';
import cx from 'classnames';
import { parseInlineMarkdown } from '../../../utils/inlineMarkdown';
import styles from './FormattedText.module.scss';

const renderNode = (node, key) => {
  if (typeof node === 'string') return node;
  if (!node || typeof node !== 'object') return null;
  const children = (node.children || []).map((child, index) => (
    <Fragment key={index}>{renderNode(child, index)}</Fragment>
  ));
  switch (node.type) {
  case 'strong':
    return <strong key={key}>{children}</strong>;
  case 'em':
    return <em key={key}>{children}</em>;
  case 'del':
    return <s key={key}>{children}</s>;
  case 'code':
    return <code key={key} className={styles.code}>{children}</code>;
  case 'br':
    return <br key={key} />;
  case 'link':
    return (
      <a
        key={key}
        className={styles.link}
        href={node.href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    );
  default:
    return <Fragment key={key}>{children}</Fragment>;
  }
};

// Renders the parsed Markdown tree as JSX. Multiple paragraphs become <p>s;
// `inline` collapses to a single span (used when the surrounding layout
// already provides paragraph spacing).
const FormattedText = ({ text, className, inline = false }) => {
  const blocks = parseInlineMarkdown(text);
  if (blocks.length === 0) return null;
  if (inline) {
    return (
      <span className={cx(styles.text, className)}>
        {blocks.map((block, index) => (
          <Fragment key={index}>
            {index > 0 && ' '}
            {block.children.map((child, i) => (
              <Fragment key={i}>{renderNode(child, i)}</Fragment>
            ))}
          </Fragment>
        ))}
      </span>
    );
  }
  return (
    <div className={cx(styles.text, className)}>
      {blocks.map((block, index) => (
        <p key={index} className={styles.paragraph}>
          {block.children.map((child, i) => (
            <Fragment key={i}>{renderNode(child, i)}</Fragment>
          ))}
        </p>
      ))}
    </div>
  );
};

export default FormattedText;
