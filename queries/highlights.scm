; Highlighting queries for PHH (.phh / .phhs), consumed by Neovim and Zed
; directly

; -- Keys --------------------------------------------------------------
; The table header's own key ([1], [first], ...) is a namespace/label, not a
; field name, so it gets its own capture distinct from pair keys.
(table name: (bare_key) @label)
(table name: (quoted_key) @label)

(pair key: (bare_key) @property)
(pair key: (quoted_key) @property)

; -- Punctuation ---------------------------------------------------------
"[" @punctuation.bracket
"]" @punctuation.bracket
"=" @operator
"," @punctuation.delimiter

; -- Literals --------------------------------------------------------------
(basic_string) @string
(literal_string) @string
(escape_sequence) @string.escape
(integer) @number
(float) @number
(local_time) @number
(boolean) @constant.builtin.boolean

(comment) @comment

; -- PHH-specific: variant codes and required field names ------------------
; These two patterns are text-matched rather than driven from
; phh/registry/variants.json: a query can't read an external JSON file.
; Every editor's LSP-side hover/completion (via phh-ls) reads that same
; registry, so the two stay independently consistent.
(pair
  key: (bare_key) @_key
  value: (string (basic_string) @string.special)
  (#eq? @_key "variant"))
(pair
  key: (bare_key) @_key
  value: (string (literal_string) @string.special)
  (#eq? @_key "variant"))
