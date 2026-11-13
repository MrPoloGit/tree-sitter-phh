; Zed's outline view: list each hand (table) keyed by its own table key,
; never assumed to be a sequential index, annotated with its variant code
; where present.
;
; NOT validated against a live Zed install in this session (no Zed CLI
; available here); the query syntax below matches Zed's documented
; @item/@name/@context convention, but confirm against Zed's own outline.scm
; examples before shipping.
(table
  name: (_) @name
  body: (pair
    key: (bare_key) @_key
    value: (string) @context)
  (#eq? @_key "variant")) @item

; A .phh file (no tables at all) still gets one outline entry for its single
; implicit hand, keyed by its variant field alone.
(document
  (pair
    key: (bare_key) @_key
    value: (string) @name)
  (#eq? @_key "variant")) @item
