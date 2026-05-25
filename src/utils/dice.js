// A small dice-notation parser. Accepts the shape that tabletop players write
// on a character sheet: any number of `XdY` terms joined with `+`/`-`, plus an
// optional flat modifier. Whitespace and case are tolerated. `d6` is shorthand
// for `1d6`.
//
// Examples that parse:
//   d6        2d6        2d6+3       d20-1
//   3d4+2d6+1            d100        D20 + 2
//
// `rollExpression` returns a result object even for invalid input — the caller
// looks at `error` to decide whether to surface a toast.

export const MAX_DICE_COUNT = 100;
export const MAX_DICE_SIDES = 1000;

const TERM_RE = /^([+-])?\s*(\d*)d(\d+)$/i;
const FLAT_RE = /^([+-])?\s*(\d+)$/;

// Split on `+`/`-` while keeping the sign attached to each piece. "2d6+3" ->
// ["2d6", "+3"], "-d4+2d6" -> ["-d4", "+2d6"]. Empty parts (e.g. a leading "+")
// are dropped.
const splitTerms = (input) => {
  const trimmed = input.replace(/\s+/g, '');
  if (!trimmed) return [];
  const parts = [];
  let current = '';
  for (let i = 0; i < trimmed.length; i += 1) {
    const ch = trimmed[i];
    if ((ch === '+' || ch === '-') && current.length > 0) {
      parts.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);
  return parts;
};

export const parseExpression = (input) => {
  if (typeof input !== 'string') return { error: 'Empty roll' };
  const cleaned = input.trim();
  if (!cleaned) return { error: 'Empty roll' };

  const terms = splitTerms(cleaned);
  if (terms.length === 0) return { error: 'Empty roll' };

  const dice = [];
  let modifier = 0;

  for (const raw of terms) {
    const diceMatch = raw.match(TERM_RE);
    if (diceMatch) {
      const sign = diceMatch[1] === '-' ? -1 : 1;
      const count = diceMatch[2] === '' ? 1 : parseInt(diceMatch[2], 10);
      const sides = parseInt(diceMatch[3], 10);
      if (!Number.isFinite(count) || count <= 0) {
        return { error: `Bad dice count in "${raw}"` };
      }
      if (!Number.isFinite(sides) || sides <= 0) {
        return { error: `Bad dice sides in "${raw}"` };
      }
      if (count > MAX_DICE_COUNT) {
        return { error: `Up to ${MAX_DICE_COUNT} dice at a time` };
      }
      if (sides > MAX_DICE_SIDES) {
        return { error: `Up to d${MAX_DICE_SIDES}` };
      }
      dice.push({ sign, count, sides });
      continue;
    }
    const flatMatch = raw.match(FLAT_RE);
    if (flatMatch) {
      const sign = flatMatch[1] === '-' ? -1 : 1;
      modifier += sign * parseInt(flatMatch[2], 10);
      continue;
    }
    return { error: `Unrecognised piece "${raw}"` };
  }

  if (dice.length === 0 && modifier === 0) return { error: 'No dice to roll' };

  return { dice, modifier };
};

// Build a clean canonical expression like "2d6+3" from a parsed result.
const canonicalize = ({ dice, modifier }) => {
  const parts = dice.map(({ sign, count, sides }) =>
    `${sign < 0 ? '-' : '+'}${count}d${sides}`
  );
  if (modifier !== 0) parts.push(`${modifier < 0 ? '-' : '+'}${Math.abs(modifier)}`);
  return (parts.join('') || '').replace(/^\+/, '');
};

const defaultRng = () => Math.random();

// Rolls a parsed expression. `rng` is injectable for deterministic tests.
export const rollParsed = ({ dice, modifier }, rng = defaultRng) => {
  const groups = dice.map(({ sign, count, sides }) => {
    const rolls = [];
    for (let i = 0; i < count; i += 1) {
      rolls.push(Math.floor(rng() * sides) + 1);
    }
    const sum = rolls.reduce((acc, value) => acc + value, 0);
    return { sign, sides, rolls, subtotal: sign * sum };
  });
  const total =
    groups.reduce((acc, group) => acc + group.subtotal, 0) + modifier;
  return { groups, modifier, total };
};

// One-shot: parse + roll. Returns either a result with `error` or a complete
// roll record ready to be logged and broadcast.
export const rollExpression = (input, rng = defaultRng) => {
  const parsed = parseExpression(input);
  if (parsed.error) return { error: parsed.error };
  const { groups, modifier, total } = rollParsed(parsed, rng);
  return {
    expression: canonicalize(parsed),
    groups,
    modifier,
    total,
  };
};
