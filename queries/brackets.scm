; Bracket-matching pairs, consumed by editors that auto-highlight/jump
; between matching brackets (Zed's bracket matching; Neovim's matchparen
; equivalent reads this when configured through nvim-treesitter).
("[" @open "]" @close)
