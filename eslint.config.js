/* I want the game's code to stay in shape, and I want to be told when it slips (the owner's rule: one module per
   mechanic, modes differ by data, never a file per mode). Everything here is a warning for now: tools/health/metrics.mjs
   counts them and `--check` fails any deploy where a count goes up. Run: npx eslint@9 js */
const MODES = "aod|wyr|bb|sc|quack|law|dunce|vdd|hang|l4dd|surv|mgj|sb|cabin";
const modeCompare = (op) => ({
  selector: `BinaryExpression[operator='${op}'] > Literal[value=/^(${MODES})$/]`,
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
            "LogicalExpression[operator='??']:matches([right.raw=/^[0-9.]/], [right.operator='-'][right.argument.raw=/^[0-9.]/])",
          message:
            "?? with a number on the right hides a missing number: put the default in js/gamedefaults.js.",
        },
      ],
    },
  },
];
