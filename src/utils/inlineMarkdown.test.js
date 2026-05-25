import { describe, it, expect } from 'vitest';
import { parseInlineMarkdown } from './inlineMarkdown';

const first = (input) => parseInlineMarkdown(input)[0]?.children ?? [];

describe('parseInlineMarkdown', () => {
  it('returns nothing for empty input', () => {
    expect(parseInlineMarkdown('')).toEqual([]);
    expect(parseInlineMarkdown('   ')).toEqual([]);
    expect(parseInlineMarkdown(null)).toEqual([]);
  });

  it('passes plain text through unchanged', () => {
    expect(first('hello world')).toEqual(['hello world']);
  });

  it('parses **bold**', () => {
    expect(first('a **brave** soul')).toEqual([
      'a ',
      { type: 'strong', children: ['brave'] },
      ' soul',
    ]);
  });

  it('parses *italic* and _italic_', () => {
    expect(first('*soft* and _quiet_')).toEqual([
      { type: 'em', children: ['soft'] },
      ' and ',
      { type: 'em', children: ['quiet'] },
    ]);
  });

  it('handles bold containing italic', () => {
    expect(first('**very *deep* dread**')).toEqual([
      {
        type: 'strong',
        children: [
          'very ',
          { type: 'em', children: ['deep'] },
          ' dread',
        ],
      },
    ]);
  });

  it('parses inline code without further markup', () => {
    expect(first('try `**not bold**` here')).toEqual([
      'try ',
      { type: 'code', children: ['**not bold**'] },
      ' here',
    ]);
  });

  it('parses strikethrough', () => {
    expect(first('was ~~friend~~ now foe')).toEqual([
      'was ',
      { type: 'del', children: ['friend'] },
      ' now foe',
    ]);
  });

  it('parses safe http(s) links', () => {
    expect(first('see [the wiki](https://example.com)')).toEqual([
      'see ',
      {
        type: 'link',
        href: 'https://example.com',
        children: ['the wiki'],
      },
    ]);
  });

  it('rejects dangerous link schemes', () => {
    expect(first('[click](javascript:alert(1))')).toEqual([
      '[click](javascript:alert(1))',
    ]);
    expect(first('[click](data:text/html,)')).toEqual([
      '[click](data:text/html,)',
    ]);
  });

  it('treats unmatched markers as literal text', () => {
    expect(first('a * lonely star')).toEqual(['a * lonely star']);
    expect(first('half **open')).toEqual(['half **open']);
  });

  it('escapes characters with a backslash', () => {
    expect(first('not \\*italic\\*')).toEqual(['not *italic*']);
  });

  it('splits paragraphs on blank lines', () => {
    const result = parseInlineMarkdown('first\n\nsecond');
    expect(result).toHaveLength(2);
    expect(result[0].children).toEqual(['first']);
    expect(result[1].children).toEqual(['second']);
  });

  it('renders single newlines as line breaks within a paragraph', () => {
    const result = parseInlineMarkdown('line one\nline two');
    expect(result).toHaveLength(1);
    expect(result[0].children).toEqual([
      'line one',
      { type: 'br', children: [] },
      'line two',
    ]);
  });

  it('parses @Name mentions', () => {
    expect(first('met @Talbot at dusk')).toEqual([
      'met ',
      { type: 'mention', name: 'Talbot', children: ['@Talbot'] },
      ' at dusk',
    ]);
  });

  it('parses @{multi word} mentions', () => {
    expect(first('met @{Sir Talbot} at dusk')).toEqual([
      'met ',
      { type: 'mention', name: 'Sir Talbot', children: ['@Sir Talbot'] },
      ' at dusk',
    ]);
  });

  it('does not match @ that follows a word character (e.g. email)', () => {
    expect(first('write me at hi@example')).toEqual(['write me at hi@example']);
  });

  it('does not match a bare @ followed by nothing', () => {
    expect(first('a @ b')).toEqual(['a @ b']);
  });
});
