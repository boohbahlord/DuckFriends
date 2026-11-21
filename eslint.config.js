/* I want the game's code to stay in shape, and I want to be told when it slips (the owner's rule: one module per
   mechanic, modes differ by data, never a file per mode). Everything here is a warning for now: tools/health/metrics.mjs
   counts them and `--check` fails any deploy where a count goes up. Run: npx eslint@9 js */
const MODES = "aod|wyr|bb|sc|quack|law|dunce|vdd|hang|l4dd|surv|mgj|sb|cabin";
const modeCompare = (op) => ({
  /* (not counted: the isX predicates that are each mode's one place for its own name, a winning side
     (`r.win`), and a button's action name (`dataset.a`): none of them asks what mode the room is in) */
  selector: `BinaryExpression[operator='${op}']:not(:has(MemberExpression[property.name=/^(win|a)$/])):not(VariableDeclarator[id.name=/^(is[A-Z]|inWorld$|survSet$)/] BinaryExpression) > Literal[value=/^(${MODES})$/]`,
  message:
    "A mode id compared with " +
    op +
    ": modes differ by data (a profile), not by if-chains (js/modes/profiles.js is the one place).",
});

export default [
  {
    files: ["js/**/*.js"],
    linterOptions: { reportUnusedDisableDirectives: "off" },
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      "max-lines": ["warn", { max: 1500, skipBlankLines: false }],
      "no-restricted-syntax": [
        "warn",
        modeCompare("==="),
        modeCompare("!=="),
        {
          selector:
            "LogicalExpression[operator='??']:matches([right.raw=/^(?!(0|1|0\\.5)$)[0-9.]/], [right.operator='-'][right.argument.raw=/^(?!1$)[0-9.]/])",
          message:
            "?? with a number on the right hides a missing number: put the default in js/gamedefaults.js.",
        },
      ],
    },
  },
  {
    /* the command line's own numbers (exit codes, head and fold sizes) are the shell's, not game rules */
    files: ["js/shell.js", "js/bash.js", "js/textutils.js"],
    rules: {
      "no-restricted-syntax": ["warn", modeCompare("==="), modeCompare("!==")],
    },
  },
];
