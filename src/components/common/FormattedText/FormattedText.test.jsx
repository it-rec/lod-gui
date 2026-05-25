import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FormattedText from './FormattedText';

describe('FormattedText', () => {
  it('renders nothing for empty text', () => {
    const { container } = render(<FormattedText text="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders **bold** as strong', () => {
    render(<FormattedText text="A **brave** soul" />);
    expect(screen.getByText('brave').tagName).toBe('STRONG');
  });

  it('renders *italic* as em', () => {
    render(<FormattedText text="*soft*" />);
    expect(screen.getByText('soft').tagName).toBe('EM');
  });

  it('renders safe links as anchor with rel="noopener"', () => {
    render(<FormattedText text="see [docs](https://example.com)" />);
    const anchor = screen.getByRole('link', { name: 'docs' });
    expect(anchor).toHaveAttribute('href', 'https://example.com');
    expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    expect(anchor).toHaveAttribute('target', '_blank');
  });

  it('leaves dangerous link schemes as literal text', () => {
    render(
      <FormattedText text="ignored [click](javascript:alert(1)) please" />
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(
      screen.getByText(/ignored \[click\]\(javascript:alert\(1\)\) please/)
    ).toBeInTheDocument();
  });

  it('renders paragraphs split by blank lines', () => {
    const { container } = render(
      <FormattedText text={'first paragraph\n\nsecond paragraph'} />
    );
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent('first paragraph');
    expect(paragraphs[1]).toHaveTextContent('second paragraph');
  });

  it('renders inline mode without paragraph wrappers', () => {
    const { container } = render(
      <FormattedText text="**hi** there" inline />
    );
    expect(container.querySelector('p')).toBeNull();
    expect(container.querySelector('strong')).toHaveTextContent('hi');
  });
});
