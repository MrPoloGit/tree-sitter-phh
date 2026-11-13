; Injects the action-notation micro-grammar (tree-sitter-phh-actions) into
; every string inside the `actions` array.
;
; #offset! trims the 1-character opening/closing quote from the injected
; range so tree-sitter-phh-actions only ever sees the string's actual
; content, never the quote characters themselves.

(pair
  key: (bare_key) @_key
  value: (array
    (string (basic_string) @injection.content))
  (#eq? @_key "actions")
  (#set! injection.language "phh_actions")
  (#offset! @injection.content 0 1 0 -1))

(pair
  key: (bare_key) @_key
  value: (array
    (string (literal_string) @injection.content))
  (#eq? @_key "actions")
  (#set! injection.language "phh_actions")
  (#offset! @injection.content 0 1 0 -1))
