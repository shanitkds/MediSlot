export class ApiClientError extends Error {
  constructor(messageOrObj, status, code, fields = {}, details = null) {
    let msg = "Request failed";
    let st = status;
    let cd = code;
    let flds = fields;
    let dtls = details;

    if (typeof messageOrObj === "object" && messageOrObj !== null) {
      msg = messageOrObj.message || "Request failed";
      st = messageOrObj.status ?? status;
      cd = messageOrObj.code ?? code;
      flds = messageOrObj.fields ?? fields ?? {};
      dtls = messageOrObj.details ?? details ?? null;
    } else if (typeof messageOrObj === "string") {
      msg = messageOrObj;
    }

    super(msg);
    this.name = "ApiClientError";
    this.status = st;
    this.code = cd;
    this.fields = flds;
    this.details = dtls;
  }
}

/**
 * Extracts a clear, human-readable error message from any error object,
 * string, ApiClientError, or backend validation payload.
 */
export function getErrorMessage(err, fallback = "An unexpected error occurred.") {
  if (!err) return fallback;
  if (typeof err === "string") return err;

  // Validation fields breakdown
  const fields = err.fields || err.error?.fields;
  if (fields && typeof fields === "object" && !Array.isArray(fields) && Object.keys(fields).length > 0) {
    const fieldDetails = Object.entries(fields)
      .map(([f, msg]) => (typeof msg === "string" ? `${f}: ${msg}` : `${f}: ${JSON.stringify(msg)}`))
      .join(", ");
    if (err.message && err.message !== "Validation failed" && err.message !== "Request failed") {
      return `${err.message} (${fieldDetails})`;
    }
    return fieldDetails;
  }

  if (Array.isArray(fields) && fields.length > 0) {
    return fields.join(", ");
  }

  if (err.message && typeof err.message === "string" && err.message.trim()) {
    return err.message;
  }

  if (err.error) {
    if (typeof err.error === "string" && err.error.trim()) return err.error;
    if (err.error.message && typeof err.error.message === "string" && err.error.message.trim()) {
      return err.error.message;
    }
  }

  if (Array.isArray(err.errors) && err.errors.length > 0) {
    return err.errors
      .map((e) => (typeof e === "string" ? e : e.message || e.msg || JSON.stringify(e)))
      .join(", ");
  }

  return fallback;
}

export function mapError(payload, status) {
  const code =
    payload?.error?.code ||
    payload?.code ||
    (status === 0 ? "NETWORK_ERROR" : status >= 500 ? "SERVER_ERROR" : "API_ERROR");

  const fields = payload?.error?.fields || payload?.fields || {};

  let message =
    payload?.message ||
    payload?.error?.message ||
    (typeof payload?.error === "string" ? payload.error : null) ||
    (status === 404
      ? "Requested resource was not found (404)"
      : status === 403
      ? "You do not have permission to perform this action (403)"
      : status === 401
      ? "Authentication session expired or unauthorized (401)"
      : status >= 500
      ? `Server encountered an error (${status}). Please try again later.`
      : "Request failed");

  // Enrich generic messages with field validation specifics
  if (
    (message === "Validation failed" || message === "Request failed" || message === "Bad request") &&
    fields &&
    typeof fields === "object" &&
    Object.keys(fields).length > 0
  ) {
    const fieldDetails = Object.entries(fields)
      .map(([f, msg]) => `${f}: ${msg}`)
      .join("; ");
    message = `${message} — ${fieldDetails}`;
  }

  return new ApiClientError({
    message,
    status,
    code,
    fields,
    details: payload,
  });
}
