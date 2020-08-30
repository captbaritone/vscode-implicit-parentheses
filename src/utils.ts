import { Disposable } from "vscode";

export function repeat(unit: string, count: number): string {
  return new Array(count).fill(unit).join("");
}

type DebounceMethods = {
  changeDelay(delay: number): void;
} & Disposable;

export type Debounced<T> = ((arg: T) => void) & DebounceMethods;

// A purpose-built debounce function for handling document change events:
// * Trailing edge only
// * Only accepts a unary function that returns void
// * Debounces per arg. Calls with different argument will not cancel eachother.
// * Can be disposed which will clean up all in-flight functions.
// * Can dynamically change its delay. All inflight functions will complete on their previous delay.
export function debounce<T extends object>(
  func: (arg: T) => void,
  delay: number
): Debounced<T> {
  let timeouts = new WeakMap<T, NodeJS.Timeout>();
  // Retain timeouts both in the WeakMap and in a set, sice the we need to be
  // able to enumerate them.
  const inFlight = new Set<NodeJS.Timeout>();

  function inner(arg: T) {
    const previousTimeout = timeouts.get(arg);
    if (previousTimeout !== undefined) {
      clearTimeout(previousTimeout);
      inFlight.delete(previousTimeout);
    }

    const timeout = setTimeout(() => {
      timeouts.delete(arg);
      inFlight.delete(timeout);
      func(arg);
    }, delay);

    inFlight.add(timeout);
    timeouts.set(arg, timeout);
  }

  inner.dispose = () => {
    inFlight.forEach((timeout) => clearTimeout(timeout));
    inFlight.clear();
    timeouts = new WeakMap();
  };

  inner.changeDelay = (newDelay: number) => {
    delay = newDelay;
  };
  return inner;
}
