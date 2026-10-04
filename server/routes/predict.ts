import type { RequestHandler } from "express";

// Proxy classification requests to the configured external model service.
export const handlePredict: RequestHandler = async (req, res) => {
  try {
    const external = process.env.EXTERNAL_PREDICT_URL;
    if (!external) {
      return res.status(503).json({
        error: "classification_service_not_configured",
        message:
          "Configure EXTERNAL_PREDICT_URL to enable waste classification.",
      });
    }

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
            return { class: String(cls), confidence: Number(conf) };
          }
          // Nested result
          if (data.result) return normalize(data.result);
          return null;
        };

        const norm = normalize(raw);
        if (
          !norm ||
          !norm.class ||
          !Number.isFinite(norm.confidence) ||
          norm.confidence < 0 ||
          norm.confidence > 1
        ) {
          return res.status(502).json({
            error: "invalid_upstream_response",
            message: "The classification service returned an invalid result.",
          });
        }

        return res.json({
          class: norm.class,
          confidence: norm.confidence,
          processingTime: elapsed,
        });
      } catch (e) {
        console.warn("Proxy JSON parse failed", (e as any)?.message || e);
        return res.status(502).json({
          error: "invalid_upstream_response",
          message: "The classification service returned invalid JSON.",
        });
      }
    }

    return res.status(502).json({
      error: "invalid_upstream_response",
      message: "The classification service did not return JSON.",
    });
  } catch (e: any) {
    console.error(
      "[Predict] Classification service request failed:",
      e?.message || e,
    );
    res.status(502).json({
      error: "classification_service_unavailable",
      message: "The classification service could not be reached.",
    });
  }
};
