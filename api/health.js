import { checkStorage, getStorageMode, hasStorageConfig } from "../lib/storage.js";

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default {
  async fetch() {
    if (!hasStorageConfig()) {
      return json({ ok: false, storage: "missing_configuration" }, 503);
    }

    try {
      const storage = await checkStorage();
      return json({ ok: true, storage });
    } catch (error) {
      console.error("Health check failed", error);
      return json({ ok: false, storage: getStorageMode(), error: "unavailable" }, 500);
    }
  },
};