; Each table (one hand, in a .phhs file) folds as a single region
(table) @fold

; The `actions` array is usually the longest single field in a hand; folding
; it independently of the rest of the table
(pair
  key: (bare_key) @_key
  value: (array) @fold
  (#eq? @_key "actions"))
