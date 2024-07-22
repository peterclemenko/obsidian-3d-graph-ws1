type OfReturnType<T> = Readonly<
  | {
      data: T;
      error: undefined;
    }
  | {
      data: undefined;
      error: Error;
    }
>;

export async function of<T = unknown>(promise: Promise<T>): Promise<OfReturnType<T>> {
  return Promise.resolve(promise)
    .then(
      (result): Readonly<{ data: T; error: undefined }> => ({
        data: result,
        error: undefined,
      })
    )
    .catch((err): Readonly<{ data: undefined; error: Error }> => {
      if (typeof err === "undefined") {
        err = new Error("Rejection with empty value");
      }

      return {
        data: undefined,
        error: err as Error,
      };
    });
}

export function syncOf<T = unknown>(operation: () => T): OfReturnType<T> {
  try {
    const result = operation(); // Execute the synchronous operation
    return {
      data: result,
      error: undefined,
    };
  } catch (error) {
    // Handle any errors thrown by the operation
    return {
      data: undefined,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
