# tree-sitter-phh

Tree-sitter grammar for the PHH (Poker Hand History) format: the TOML-level
document structure.
See `tree-sitter-phh-actions/` (sibling directory) for the separate grammar
that parses the contents of each `actions` array string; this grammar wires
that one in via `queries/injections.scm` rather than parsing action strings
itself (see `grammar.js`'s file header for why).

## Status

Generates cleanly with `tree-sitter generate` (ABI 15) and parses the full
corpus at `../phh/corpus/` with **zero `ERROR` nodes**, including all five
`invalid/` fixtures, which is correct: they are semantically invalid (wrong
field for the variant, illegal action verb, etc.), not syntactically invalid,
and L0 (grammar) / L1 (registry-driven semantic checks, not built yet) are
deliberately separate layers.

Covers: bare/quoted keys, basic (`"..."`) and literal (`'...'`) strings,
integers, floats (including `inf`/`nan`), booleans, local time, arrays, and
table headers (`[key]`, with the table owning its following `pair`s as real
children, not flat siblings, so a folding/outline query doesn't have to
compute "everything up to the next table" itself).

Deliberately **not** implemented: multi-line strings, inline tables, TOML
dates/datetimes, array-of-tables (`[[key]]`). No PHH field or action needs
any of these (`phh/registry/fields.json`, `phh/registry/actions.json`); a
document using one is valid TOML but not valid PHH, which surfaces as an L1
diagnostic from `phh-ls`, not a grammar error. Multi-line strings would need
a hand-written external C scanner to be correct, since tree-sitter's lexer
is DFA-based, not backtracking (confirmed by hitting tree-sitter's own
"unclosed character class" rejection of a non-greedy `[^]*?` scan while
first writing this grammar), and not worth it for a feature nothing in PHH
uses.

## A real bug this corpus caught

Before `basic_string`/`literal_string` used `token.immediate` on their
content, a `#` character *inside* a quoted string (e.g.
`event = "2019 WSOP Event #58"` in
`../phh/corpus/valid/arieh-esposito-hui-yockey-2019.phh`, a real hand from
`phh-std/examples.rst`) was swallowed by the `comment` extra: tree-sitter's
longest-match lexing picked the much-longer `comment` token over the
single-character content regex it was competing against, consuming the rest
of the line including the closing quote, and cascading into a large `ERROR`
node. `token.immediate` on every piece between the quotes closes this,
matching the standard tree-sitter idiom used by e.g. tree-sitter-json's own
string rule. Found and fixed by actually parsing the real corpus, not by
inspection; the grammar "looked right" before this was caught.

## Queries (`queries/`)

| File | Purpose | Validated how |
|---|---|---|
| `highlights.scm` | Keys, punctuation, literals, variant-code special-casing | `tree-sitter query` against the corpus |
| `injections.scm` | Injects `phh_actions` into every string in an `actions` array (both `"..."` and `'...'` forms, since PokerKit's own writer emits literal strings) | `tree-sitter query` against the corpus; correctly matches every action string in every fixture |
| `folds.scm` | Fold a whole hand (`table`) or just its `actions` array | `tree-sitter query` against the corpus |
| `indents.scm` | Indent inside multi-line arrays | `tree-sitter query` against the corpus |
| `outline.scm` | One outline entry per hand, keyed by the table's own key (never assumed sequential) plus its `variant` | `tree-sitter query` against both a `.phh` and a `.phhs` fixture. **Not validated against a live Zed install.** Matches Zed's documented `@item`/`@name`/`@context` convention but confirm before shipping. |
| `brackets.scm` | `[`/`]` matching | Trivial; not separately re-verified beyond generation |

## What's next (not started here)

- `phh-ls` (the LSP server) consuming this grammar plus `phh/registry/` for
  diagnostics, hover, and completion.
- A VS Code TextMate grammar kept in sync with this one via a golden-scope
  test, since VS Code does not consume tree-sitter grammars directly.
- Packaging (`tree-sitter.json`'s `links.repository` is a placeholder) once
  there's an actual repository to point at.
