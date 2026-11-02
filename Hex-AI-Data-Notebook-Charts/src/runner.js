export function runSql(query, region, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Query cancelled", "AbortError"));
      return;
    }
    const worker = new Worker(new URL("./query-worker.js", import.meta.url), {
      type: "module",
    });
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      worker.terminate();
    };
    const fail = (error) => {
      cleanup();
      reject(error);
    };
    const abort = () => fail(new DOMException("Query cancelled", "AbortError"));
    const timer = setTimeout(
      () =>
        fail(
          new Error(
            "Query exceeded the 8-second limit. Simplify it and try again.",
          ),
        ),
      8000,
    );
    signal?.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event) => {
      cleanup();
      event.data.ok ? resolve(event.data) : reject(new Error(event.data.error));
    };
    worker.onerror = () =>
      fail(
        new Error(
          "The local SQL worker could not start. Check that the app assets and WASM file are available.",
        ),
      );
    worker.postMessage({ query, region });
  });
}
