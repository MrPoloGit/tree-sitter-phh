/**
 * tree-sitter-phh: grammar for the PHH (Poker Hand History) format.
 *
 * PHH is a TOML derivative (phh-std/spec.rst): a .phh file is one hand as a
 * flat sequence of key/value pairs; a .phhs file is zero or more top-level
 * tables, each one hand, with no constraint on the table key (confirmed
 * against pokerkit.notation.HandHistory.load_all with both sequential-integer
 * and arbitrary string keys, see phh/corpus/valid/phhs-nonsequential-keys.phhs).
 *
 * Covers the TOML subset PHH actually uses: bare/quoted keys, basic and
 * literal strings, integers, floats (including inf/nan), booleans, local
 * time, arrays, and standard-table headers ([key]). Does not implement
 * multi-line strings, inline tables, dates, datetimes, or array-of-tables
 * ([[key]]) headers, since nothing in the PHH field catalogue
 * (phh/registry/fields.json) or the action-notation grammar
 * (phh/registry/actions.json) needs them. A document using one of these
 * forms is valid TOML but not valid PHH, and surfaces as a semantic
 * (registry-level) diagnostic from phh-ls rather than a grammar error.
 *
 * Newlines are not tracked structurally: every terminal below is already
 * bounded so it cannot contain an unescaped newline, so a newline is just
 * insignificant whitespace between tokens, same as tree-sitter-json.
 *
 * The contents of each string inside the `actions` array are a separate
 * micro-grammar (phh/registry/actions.json), left as an opaque string node
 * here; `tree-sitter-phh-actions` parses them, wired in via
 * queries/injections.scm.
 */

module.exports = grammar({
  name: "phh",

  extras: ($) => [/[ \t\r\n]/, $.comment],

  rules: {
    // A table owns every pair up to the next table header or end of file,
    // as a real parent/child relationship rather than flat siblings, so a
    // folding/outline query can just fold/list each table node directly.
    // A .phh file (no tables) is just the leading repeat($.pair); a .phhs
    // file is normally that repeat empty, followed by one table per hand.
    document: ($) => seq(repeat($.pair), repeat($.table)),

    table: ($) => seq("[", field("name", $._key), "]", repeat(field("body", $.pair))),

    pair: ($) => seq(field("key", $._key), "=", field("value", $._value)),

    _key: ($) => choice($.bare_key, $.quoted_key),

    // Covers both ordinary PHH field names (snake_case, e.g. starting_stacks)
    // and .phhs hand-table headers (bare digits, e.g. [1], [42]). TOML bare
    // keys allow digits and are untyped, matching load_all's confirmed
    // read-side leniency about table-header keys (see module doc above).
    bare_key: ($) => /[A-Za-z0-9_-]+/,

    // A key wrapped in quotes, e.g. "my key" = 1. TOML allows this; no PHH
    // field name needs it (they're all snake_case bare keys), but a
    // .phhs hand-table header or a user-defined field name could use one.
    quoted_key: ($) => choice($.basic_string, $.literal_string),

    _value: ($) =>
      choice(
        $.string,
        $.boolean,
        $.float,
        $.integer,
        $.local_time,
        $.array,
      ),

    string: ($) => choice($.basic_string, $.literal_string),

    // "...": most PHH field values and every action string live here.
    //
    // Every piece between the quotes uses token.immediate, which forbids
    // extras (comments, whitespace) from being inserted before it. Without
    // this, a '#' inside the string content (e.g. event = "2019 WSOP Event
    // #58") is itself a valid start of the `comment` extra, and since that
    // extra's regex (`#[^\n]*`) matches far more input than the one
    // content-char alternative it competes with, tree-sitter's longest-match
    // rule picks the comment, swallowing the rest of the line including the
    // closing quote. Confirmed by hitting exactly this bug against
    // phh/corpus/valid/arieh-esposito-hui-yockey-2019.phh's `event` field,
    // which contains a literal '#' character, before adding token.immediate.
    basic_string: ($) =>
      seq(
        '"',
        repeat(choice($.escape_sequence, $._basic_string_fragment)),
        token.immediate('"'),
      ),
    _basic_string_fragment: ($) => token.immediate(/[^"\\\n]+/),
    escape_sequence: ($) =>
      token.immediate(/\\(["\\bfnrt]|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/),

    // '...': PokerKit's own writer (HandHistory.dumps/dumps_all) emits
    // these for every string field, so a formatter round-tripping PokerKit
    // output must handle literal strings as the common case too. Literal
    // strings have no escapes, so a single token.immediate content regex is
    // enough (same '#'-swallowing hazard applies and is fixed the same way).
    literal_string: ($) => seq("'", token.immediate(/[^'\n]*/), token.immediate("'")),

    boolean: ($) => choice("true", "false"),

    // Signed integers, including underscores as digit separators (TOML 1.0).
    integer: ($) => /[+-]?(0|[1-9](_?[0-9])*)/,

    // Signed floats, including inf/nan. PHH leans on `inf` for an unknown
    // starting stack or an untimed time_limit (phh-std/required.rst
    // "Starting Stacks"; phh-std/optional.rst "Time Limit").
    float: ($) =>
      choice(
        /[+-]?(0|[1-9](_?[0-9])*)(\.[0-9](_?[0-9])*)?[eE][+-]?[0-9](_?[0-9])*/,
        /[+-]?(0|[1-9](_?[0-9])*)\.[0-9](_?[0-9])*/,
        /[+-]?(inf|nan)/,
      ),

    // A TOML local time (no timezone), used by the optional `time` field.
    local_time: ($) => /[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?/,

    array: ($) =>
      seq(
        "[",
        optional(seq($._value, repeat(seq(",", $._value)), optional(","))),
        "]",
      ),

    // A TOML comment: '#' to end of line, ignored by the parser everywhere
    // in the document. Inside an `actions` string, a trailing ` # ...` is
    // instead the PHH *commentary* mechanism, part of that string's own
    // grammar (tree-sitter-phh-actions): the two look identical in source
    // text but live at different grammar layers, which is why actions are
    // injected rather than parsed inline here.
    comment: ($) => /#[^\n]*/,
  },
});
