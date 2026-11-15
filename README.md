# tree-sitter-phh

Tree-sitter grammar for the PHH (Poker Hand History) format: the TOML-level
document structure.
See `tree-sitter-phh-actions/` (sibling directory) for the separate grammar
that parses the contents of each `actions` array string; this grammar wires
that one in via `queries/injections.scm` rather than parsing action strings
itself (see `grammar.js`'s file header for why).
