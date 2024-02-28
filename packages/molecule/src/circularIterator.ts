type CircularIterator<T> = {
  current(): T | undefined;
  // move to the next point and return it
  next(): T | undefined;
  // delete the current element, move and return the next element
  removeAndNext(): T | undefined;
  hasNext(): boolean;
};

export function circularIterator<T extends object>(
  elems: T[]
): CircularIterator<T> {
  const items = [...elems];
  let current = items[0];

  return {
    current: () => current,
    next: () => {
      const index = items.indexOf(current);
      current = items[(index + 1) % items.length];
      return current;
    },
    removeAndNext() {
      const index = items.indexOf(current);
      items.splice(index, 1);
      current = items[index % items.length];
      return current;
    },
    hasNext: () => items.length > 0,
  };
}
