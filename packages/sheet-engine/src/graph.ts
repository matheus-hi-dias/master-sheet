import {
  collectFields,
  type FormulaFieldDefinition,
  type SheetData,
  type TemplateStructure,
} from '@master-sheet/contracts';
import {
  evaluateFormula,
  FormulaParseError,
  type FormulaValues,
} from './formula';

export type DependencyGraph = Map<string, string[]>;

type GraphInput = DependencyGraph | Record<string, string[]>;

export function buildDependencyGraph(
  structure: TemplateStructure,
): DependencyGraph {
  const graph: DependencyGraph = new Map();

  for (const field of collectFields(structure)) {
    if (field.type === 'formula') {
      graph.set(field.id, [...field.dependencies]);
    }
  }

  return graph;
}

export function detectCycles(graph: GraphInput): string[][] {
  const entries: Array<[string, string[]]> =
    graph instanceof Map ? [...graph.entries()] : Object.entries(graph);

  const adjacency = new Map<string, string[]>();
  for (const [id, dependencies] of entries) {
    adjacency.set(id, dependencies);
  }

  const state = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  const seen = new Set<string>();

  const visit = (id: string) => {
    const current = state.get(id);
    if (current === 'visited') return;
    if (current === 'visiting') {
      const start = stack.indexOf(id);
      if (start >= 0) {
        const cycle = stack.slice(start).sort();
        const key = cycle.join('|');
        if (!seen.has(key)) {
          seen.add(key);
          cycles.push(cycle);
        }
      }
      return;
    }

    state.set(id, 'visiting');
    stack.push(id);

    for (const dependency of adjacency.get(id) ?? []) {
      if (adjacency.has(dependency)) {
        visit(dependency);
      }
    }

    stack.pop();
    state.set(id, 'visited');
  };

  for (const [id] of entries) {
    visit(id);
  }

  return cycles.sort((left, right) =>
    left.join('|').localeCompare(right.join('|')),
  );
}

export function evaluateStructure(
  structure: TemplateStructure,
  data: SheetData,
): SheetData {
  const fields = collectFields(structure);
  const byId = new Map(fields.map((field) => [field.id, field]));
  const values: FormulaValues = {
    ...(typeof data === 'object' && data !== null ? data : {}),
  };
  const visiting = new Set<string>();
  const resolved = new Set<string>();

  const resolveFormula = (field: FormulaFieldDefinition): number | null => {
    if (resolved.has(field.id)) {
      const value = values[field.id];
      return typeof value === 'number' ? value : null;
    }

    if (visiting.has(field.id)) {
      return null;
    }

    visiting.add(field.id);

    for (const dependency of field.dependencies) {
      const target = byId.get(dependency);

      if (!target) {
        continue;
      }

      if (target.type === 'formula') {
        values[dependency] = resolveFormula(target);
      }
    }

    visiting.delete(field.id);
    resolved.add(field.id);

    try {
      const result = evaluateFormula(field.expression, values);
      values[field.id] = result;
      return result;
    } catch (error) {
      if (error instanceof FormulaParseError) {
        values[field.id] = null;
        return null;
      }
      throw error;
    }
  };

  for (const field of fields) {
    if (field.type === 'formula') {
      resolveFormula(field);
    }
  }

  return values;
}
