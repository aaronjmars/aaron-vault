type Listener = (active: boolean) => void;

const listeners = new Set<Listener>();
let patched = false;

type StartFn = (cb: () => void) => unknown;

interface TransitionHost {
  startViewTransition?: StartFn;
}

function notify(active: boolean) {
  for (const l of listeners) l(active);
}

function patch() {
  if (patched || typeof document === "undefined") return;
  patched = true;
  const host = document as TransitionHost;
  const original = host.startViewTransition;
  if (!original) return;
  host.startViewTransition = (cb: () => void) => {
    notify(true);
    const result = original.call(document, cb) as { finished?: Promise<unknown> } | undefined;
    const done = () => notify(false);
    if (result && typeof result.finished?.then === "function") result.finished.then(done, done);
    else done();
    return result;
  };
}

export function onTransitionChange(cb: Listener): () => void {
  patch();
  listeners.add(cb);
  return () => listeners.delete(cb);
}
