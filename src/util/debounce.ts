// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMilliseconds: number
): (...args: Parameters<T>) => void {
  let timeoutId: Timer | undefined;

  return function (...args: Parameters<T>) {
    const doLater = () => {
      clearTimeout(timeoutId!);
      func(...args);
    };

    clearTimeout(timeoutId!);
    timeoutId = setTimeout(doLater, waitMilliseconds);
  };
}
