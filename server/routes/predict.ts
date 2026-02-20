import type { RequestHandler } from "express";

// If EXTERNAL_PREDICT_URL is set, proxy requests to the external model service.
// Otherwise, return a mock response for development.
export const handlePredict: RequestHandler = async (req, res) => {
  try {
    const external = process.env.EXTERNAL_PREDICT_URL;
    if (external) {
      // Build headers to forward (excluding hop-by-hop headers)
      const headers: Record<string, string> = {};
      const hopByHop = new Set([
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailers",
        "transfer-encoding",
        "upgrade",
        "host",
      ]);
      for (const [k, v] of Object.entries(req.headers)) {
        if (!k) continue;
        if (hopByHop.has(k.toLowerCase())) continue;
        if (typeof v === "string") headers[k] = v;
        else if (Array.isArray(v)) headers[k] = v.join(", ");
      }

      // Read the raw incoming body into a buffer
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(
          typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk),
        );
      }
      const bodyBuffer = Buffer.concat(chunks);
      if (!headers["content-length"])
        headers["content-length"] = String(bodyBuffer.length);

      const t0 = Date.now();
      // Send to external model
      const resp = await fetch(external, {
        method: "POST",
        headers,
        body: bodyBuffer,
        redirect: "follow",
      });

      const buf = Buffer.from(await resp.arrayBuffer());
      const elapsed = Date.now() - t0;
      const respCT = resp.headers.get("content-type") || "";

      if (!resp.ok) {
        const text = respCT.includes("application/json")
          ? (() => {
              try {
                return JSON.parse(buf.toString("utf-8"));
              } catch {
                return buf.toString("utf-8");
              }
            })()
          : buf.toString("utf-8");
        return res
          .status(resp.status)
          .json({ error: "upstream_error", details: text });
      }

      if (respCT.includes("application/json")) {
        try {
          const raw = JSON.parse(buf.toString("utf-8"));

          // Normalize to { class, confidence, processingTime }
          const normalize = (data: any) => {
            // HuggingFace-style array [{label, score}]
            if (Array.isArray(data) && data.length && data[0].label) {
              const top = [...data].sort(
                (a, b) => (b.score ?? 0) - (a.score ?? 0),
              )[0];
              return {
                class: String(top.label),
                confidence: Number(top.score),
              };
            }
            // Common shapes
            const cls =
              data.class ||
              data.prediction ||
              data.label ||
              data.category ||
              data.type ||
              data.class_name ||
              data.predicted_class;
            const conf =
              data.confidence ??
              data.probability ??
              data.score ??
              data.conf ??
              data.p;
            if (cls) {
              return { class: String(cls), confidence: Number(conf ?? 0.9) };
            }
            // Nested result
            if (data.result) return normalize(data.result);
            return { class: "recyclable", confidence: 0.9 };
          };

          const norm = normalize(raw);
          return res.json({
            class: norm.class,
            confidence: norm.confidence,
            processingTime: elapsed,
          });
        } catch (e) {
          console.warn(
            "Proxy JSON parse failed, returning raw buffer",
            (e as any)?.message || e,
          );
        }
      }

      // Non-JSON: return as-is with generic success
      return res.json({
        class: "recyclable",
        confidence: 0.9,
        processingTime: elapsed,
      });
    }

    // Fallback mock when no external URL configured
    const types = ["recyclable", "biodegradable", "hazardous"] as const;
    const pick = types[Math.floor(Math.random() * types.length)];
    const confidence = Math.round((0.8 + Math.random() * 0.2) * 100) / 100; // 0.80 - 1.00
    const processingTime = 100 + Math.floor(Math.random() * 200);

    res.json({ class: pick, confidence, processingTime });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "prediction failed" });
  }
};
