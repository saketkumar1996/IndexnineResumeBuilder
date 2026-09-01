/**
 * The `detail` payload is the client's error contract: readErrorMessage() in
 * frontend/src/utils/api.ts reads `detail`, then `detail.message`, then `message`.
 */
export class HttpError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : "Request failed");
    this.name = "HttpError";
    this.status = status;
    this.detail = detail;
  }
}

export const badRequest = (detail: unknown) => new HttpError(400, detail);
export const unauthorized = (detail: unknown = "Authentication required") => new HttpError(401, detail);
export const notFound = (detail: unknown) => new HttpError(404, detail);
export const conflict = (detail: unknown) => new HttpError(409, detail);
export const badGateway = (detail: unknown) => new HttpError(502, detail);
export const serviceUnavailable = (detail: unknown) => new HttpError(503, detail);
