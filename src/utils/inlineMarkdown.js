// A deliberately small Markdown-ish formatter for the campaign companion's
// free-text fields (quest notes, NPC bios, location lore, hero scars, ...).
//
// Supports:
//   **bold**         → strong
//   *italic*  _it_   → emphasis
//   `code`           → inline code
//   ~~strike~~       → strikethrough
//   [label](url)     → safe http/https/mailto link (other schemes ignored)
//   blank line       → paragraph break
//   single newline   → line break
//
// Returns a tree of plain nodes — each one either a string or an object
// `{ type, children, href? }` — so a React component can map them to JSX
// without ever pushing raw HTML through `dangerouslySetInnerHTML`.

const SAFE_URL = /^(?:https?:\/\/|mailto:)/i;

// Order matters: longer/wider markers are matched first so `**bold**` is not
// consumed as two `*italic*` pairs.
const PATTERNS = [
  { type: 'strong', open: '**', close: '**' },
  { type: 'del', open: '~~', close: '~~' },
  { type: 'em', open: '*', close: '*' },
  { type: 'em', open: '_', close: '_' },
  { type: 'code', open: '`', close: '`', raw: true },
];

const parseLink = (text, start) => {
  if (text[start] !== '[') return null;
  // [label](url): both halves must close cleanly. Brackets and parens inside
  // the label or url break the match.
  const labelEnd = text.indexOf(']', start + 1);
  if (labelEnd === -1) return null;
  if (text[labelEnd + 1] !== '(') return null;
  const urlEnd = text.indexOf(')', labelEnd + 2);
  if (urlEnd === -1) return null;
  const label = text.slice(start + 1, labelEnd);
  const url = text.slice(labelEnd + 2, urlEnd).trim();
  if (!url || !SAFE_URL.test(url)) return null;
  if (!label) return null;
  return {
    node: { type: 'link', href: url, children: parseInline(label) },
    end: urlEnd + 1,
  };
};

const matchInlineSpan = (text, start) => {
  const ch = text[start];
  for (const pattern of PATTERNS) {
    if (!text.startsWith(pattern.open, start)) continue;
    const innerStart = start + pattern.open.length;
    // Bold/italic need a non-space char after the opener and before the
    // closer; otherwise "a * b * c" turns into garbled emphasis.
    if (!pattern.raw) {
      const after = text[innerStart];
      if (!after || after === ' ' || after === '\n') continue;
    }
    let searchFrom = innerStart;
    while (true) {
      const closeAt = text.indexOf(pattern.close, searchFrom);
      if (closeAt === -1) break;
      // Empty content (closer immediately after opener) is not a real span —
      // it usually means we are actually inside a longer marker, e.g. the
      // single `*` trying to close inside `**`.
      if (closeAt === innerStart) {
        searchFrom = closeAt + pattern.close.length;
        continue;
      }
      if (!pattern.raw) {
        const before = text[closeAt - 1];
        if (before === ' ' || before === '\n') {
          searchFrom = closeAt + pattern.close.length;
          continue;
        }
      }
      const innerEnd = closeAt;
      const inner = text.slice(innerStart, innerEnd);
      const children = pattern.raw ? [inner] : parseInline(inner);
      return {
        node: { type: pattern.type, children },
        end: closeAt + pattern.close.length,
      };
    }
    // No matching closer — fall through to the next pattern.
    void ch;
  }
  return null;
};

const pushText = (nodes, text) => {
  if (!text) return;
  const last = nodes[nodes.length - 1];
  if (typeof last === 'string') {
    nodes[nodes.length - 1] = last + text;
  } else {
    nodes.push(text);
  }
};

// Parse a single line's inline markup. Returns an array of nodes.
const parseInline = (text) => {
  const nodes = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '\\' && i + 1 < text.length) {
      pushText(nodes, text[i + 1]);
      i += 2;
      continue;
    }
    if (ch === '[') {
      const link = parseLink(text, i);
      if (link) {
        nodes.push(link.node);
        i = link.end;
        continue;
      }
    }
    const span = matchInlineSpan(text, i);
    if (span) {
      nodes.push(span.node);
      i = span.end;
      continue;
    }
    pushText(nodes, ch);
    i += 1;
  }
  return nodes;
};

// Split into paragraphs on blank lines, then handle single newlines inside a
// paragraph as soft breaks ("br" nodes).
export const parseInlineMarkdown = (input) => {
  if (typeof input !== 'string' || !input.trim()) return [];
  // Normalise CRLF; trim trailing whitespace per line.
  const normalised = input.replace(/\r\n?/g, '\n');
  const paragraphs = normalised.split(/\n\s*\n+/);
  return paragraphs
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const lines = paragraph.split('\n');
      const children = [];
      lines.forEach((line, index) => {
        if (index > 0) children.push({ type: 'br', children: [] });
        parseInline(line).forEach((node) => children.push(node));
      });
      return { type: 'paragraph', children };
    });
};
