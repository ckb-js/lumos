type ID = string | number;

interface Node {
  id: ID;
  dependencies: ID[];
}

/**
 * topological sort with circular check
 * @param graph
 */
export function topologySort<T extends Node>(graph: T[]): T[];
/**
 * topological sort with circular check and custom node transformation
 * @param graph
 * @param cb
 */
export function topologySort<T>(graph: T[], cb: (element: T) => Node): T[];
// topological sort with circular check
export function topologySort<T>(graph: T[], cb?: (element: T) => Node): T[] {
  const sorted: T[] = [];
  const visited: Set<ID> = new Set();
  const visiting: Set<ID> = new Set();

  const toNode = (cb ? cb : id) as (value: T) => Node;

  function visit(node: T, path: ID[]) {
    const { id, dependencies } = toNode(node);

    if (visiting.has(id)) {
      const cycle = path.slice(path.indexOf(id)).concat(id).join(" -> ");
      throw new Error(`Circular dependency detected: ${cycle}`);
    }

    if (!visited.has(id)) {
      visiting.add(id);
      path.push(id);

      for (const depId of dependencies) {
        const dependency = graph.find((n) => toNode(n).id === depId);

        if (dependency) {
          visit(dependency, [...path]);
        } else {
          throw new Error(`Dependency not found: ${depId}`);
        }
      }

      visited.add(id);
      visiting.delete(id);
      sorted.push(node);
    }
  }

  for (const node of graph) {
    visit(node, []);
  }

  return sorted;
}

function id<T>(value: T): T {
  return value;
}
