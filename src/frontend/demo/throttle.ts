export function throttle(func: (...args: any[]) => void, timeout: number = 100) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let nextArgs: undefined | any[] = undefined;

  return (...args: any[]) => {
    if (timeoutId) {
      nextArgs = args;
      return;
    }

    func(...args);
    nextArgs = undefined;

    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      if (nextArgs) func(...nextArgs);
    }, timeout);
  };
}
