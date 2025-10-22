const DEFAULTS = {
  vt_seconds: 60,          // VT must exceed your per-message processing time
  qty: 64,                 // how many messages per read
  poll_seconds: 5,         // long-poll duration
  poll_interval_ms: 100,   // poll cadence
  cleanup_grace_ms: 2000,  // linger past VT to catch stragglers
  max_run_ms: 55_000       // timebox the invocation
};

export function createDrainHandler(supabase, queue_name, handle, cfg = {}) {
  const c = { ...DEFAULTS, ...cfg };

  if (typeof handle !== "function") {
    throw new Error("handle(message) must return 'archive' | 'delete' | null");
  }

  return async function drain(req) {
    const deadline = Date.now() + c.max_run_ms;

    let becameActive = false;
    let cleanupUntil = 0;

    const counts = { read: 0, archive: 0, delete: 0, skipped: 0, errors: 0 };

    while (Date.now() < deadline) {
      const remainingSec = Math.max(1, Math.floor((deadline - Date.now()) / 1000));
      const pollSeconds = Math.min(c.poll_seconds, remainingSec);

      const { data: msgs, error: readErr } = await supabase
        .schema("pgmq")
        .rpc("read_with_poll", {
          queue_name,
          vt: c.vt_seconds,
          qty: c.qty,
          max_poll_seconds: pollSeconds,
          poll_interval_ms: c.poll_interval_ms
        });

      if (readErr) {
        console.log("[drain] read error:", readErr.message);
        counts.errors++;
        continue;
      }

      if (!msgs || msgs.length === 0) {
        if (!becameActive) break;
        if (Date.now() >= cleanupUntil) break;
        continue;
      }

      becameActive = true;
      cleanupUntil = Date.now() + (c.vt_seconds * 1000) + c.cleanup_grace_ms;

      for (let i = 0; i < msgs.length; i++) {
        const m = msgs[i];
        counts.read++;

        let decision = null;
        try {
          decision = await handle(m); // "archive" | "delete" | null
        } catch (e) {
          console.log("[drain] handler error:", m.msg_id, e && e.message);
          counts.skipped++;
          continue;
        }

        if (decision === "archive" || decision === "delete") {
          const { error } = await supabase
            .schema("pgmq")
            .rpc(decision, { queue_name, msg_id: m.msg_id });

          if (error) {
            console.log(`[drain] ${decision} error:`, m.msg_id, error.message);
            counts.errors++;
          } else {
            counts[decision]++;
          }
        } else {
          counts.skipped++;
        }
      }
    }

    const body = JSON.stringify({
      queue_name,
      counts,
      active: becameActive,
      emptied: becameActive ? (Date.now() >= cleanupUntil) : true
    });

    const status = (counts.archive + counts.delete) > 0 ? 200 : 204;
    return new Response(body, {
      status,
      headers: { "content-type": "application/json" }
    });
  };
}
