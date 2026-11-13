; PHH's only multi-line construct that needs indent tracking is the `actions`
; array (phh-std/style.rst's own examples write one action per line); table
; bodies are flat key = value lines with no indent of their own.
(array "[" @indent.begin "]" @indent.end)
