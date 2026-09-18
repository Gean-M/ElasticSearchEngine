export class EsException extends Error {
  statusCode: number;
  rawBody: string | null;

  constructor(message: string, statusCode = -1, rawBody: string | null = null) {
    super(message);
    this.name = "EsException";
    this.statusCode = statusCode;
    this.rawBody = rawBody;
  }
}
