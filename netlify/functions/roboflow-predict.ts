import { requestRoboflowPrediction, RoboflowProxyError } from "../../server/roboflow-proxy";

export const handler = async (event: {
  httpMethod: string;
  body: string | null;
  isBase64Encoded: boolean;
}) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "method_not_allowed" }) };
  }

  const image = event.isBase64Encoded
    ? Buffer.from(event.body ?? "", "base64").toString("utf8")
    : event.body ?? "";

  try {
    const result = await requestRoboflowPrediction(image);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    if (error instanceof RoboflowProxyError) {
      return {
        statusCode: error.status,
        body: JSON.stringify({ error: error.code, message: error.message }),
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "proxy_error", message: "Unable to analyze this image. Please try again." }),
    };
  }
};
