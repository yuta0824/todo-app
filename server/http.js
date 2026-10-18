export class HttpError extends Error {
  constructor(status, message, { headers, ...options } = {}) {
    super(message, options);
    this.name = "HttpError";
    this.status = status;
    this.headers = headers;
  }
}

export function errorResponse(status, message, headers) {
  return Response.json({ error: { message } }, { status, headers });
}

export function methodNotAllowed(allowedMethods) {
  return new HttpError(405, "このメソッドは使えません", {
    headers: { Allow: allowedMethods.join(", ") },
  });
}

export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw new HttpError(400, "リクエストボディが正しい JSON ではありません", {
      cause: error,
    });
  }
}
