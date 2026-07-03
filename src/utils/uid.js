// One id generator for every ledger. Uses the browser's UUID when available
// and falls back to a prefixed random slug in older environments — the prefix
// keeps ids recognisable in stored payloads (`kw-…`, `jnl-…`, `cmb-…`).
export const makeUid = (prefix = 'id') =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
