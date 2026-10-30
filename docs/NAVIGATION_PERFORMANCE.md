# Local navigation and preview

For reviewing the website, run `npm run preview`. It builds into the ignored
`.next-preview` directory, then starts the optimized frontend on
`http://127.0.0.1:3001` with the existing validation service and workers.
Stop the current server first so its ports are available. Source changes need
another preview build; use `npm run dev` while editing.

The preview launcher passes an explicit local-preview flag and binds to loopback.
It retains the existing local prototype only when `VIDYA_DEMO_MODE=1` is already
configured. Ordinary production starts keep their existing authentication and
authenticator requirements. No account or role is granted by the preview flag.

In development, the launcher prepares page code serially in the background using
requests without a signed-in session. Set `VIDYA_PREWARM=0` to disable that work.
Development still includes compilation and hot-reload overhead; preview avoids
that overhead and enables Next's normal navigation prefetching.

Navigation now has a streamed loading boundary and a pending indicator, and the
root presentation no longer remounts all descendants when the pathname changes.
Supabase token refresh uses signed claims in Proxy; pages still verify the user
with `getUser`, memoized only for a single React server render.

Upload and anomaly polling pauses in hidden tabs, aborts on unmount, and waits
for each request to complete before scheduling the next. Active jobs refresh
frequently; idle views poll less often and refresh when brought back into focus.
Anomaly input fingerprints cache only a digest, invalidated by SQLite triggers
for all model input tables. Identity check timestamps do not invalidate it.
Review mutations still validate current model inputs before accepting a decision.

Regression checks cover polling visibility, overlap and cancellation; local
preview boundaries; same-connection and cross-connection cache invalidation;
and rollback behavior. Existing anomaly workflow tests cover stale evidence,
scoped review decisions and policy changes.
