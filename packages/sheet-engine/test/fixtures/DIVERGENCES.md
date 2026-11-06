# Formula characterization notes

Captured before removing the three independent implementations:

| Source                                         | Parsing                                                                 | Evaluation                                       | Missing dependency                                  | Division by zero    | Unknown function |
| ---------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------- | ------------------- | ---------------- |
| `apps/api/src/templates/utils/formula.util.ts` | Grammar-only (`assertValidFormula`), max length 500, nesting depth 50   | None (server only validates template structures) | N/A (undeclared identifiers rejected at validation) | N/A                 | Throws           |
| `apps/web/src/lib/formula.ts`                  | Parses and evaluates in one pass                                        | Returns a `number`                               | Throws `Unknown identifier`                         | Throws `non-finite` | Throws           |
| `apps/mobile/lib/formula.ts`                   | Same parser/evaluator as web (one-character difference in class layout) | Returns a `number`                               | Throws `Unknown identifier`                         | Throws `non-finite` | Throws           |

## Canonical behavior adopted

The API copy is the server source of truth for template validation, and `design.md` D3 defines the runtime
contract for the shared engine. Where the web/mobile evaluator disagreed, the shared engine follows D3:

1. **Missing, non-numeric, or inherited values** evaluate to `null`. No value is read from an object prototype.
2. **Non-finite results** (division/modulo by zero, overflow) evaluate to `null`.
3. **Parse failures** (empty formula, over 500 characters, deeper than 50 nesting levels, unknown function,
   malformed syntax, unexpected characters) are returned as structured parse errors. The app call sites keep
   rendering a field error / em dash because they catch the error.
4. **Template validation remains API-canonical**: duplicate ids, undeclared identifiers in an expression,
   missing dependency targets, non-numeric dependencies, and formula-to-formula dependencies (depth 1) are
   rejected. Cycle detection is implemented and reported as `FORMULA_CYCLE`.

The corpus in `formula-corpus.json` and `structure-corpus.json` encodes these decisions without changing the
original expected numeric results for valid expressions.
