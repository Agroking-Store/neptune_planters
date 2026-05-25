// ─────────────────────────────────────────────
// Standardized API Response shape
// ─────────────────────────────────────────────
export interface ApiResponseShape<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta?: Record<string, unknown>;
}

export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly data: T | null;
  public readonly meta?: Record<string, unknown>;

  constructor(
    success: boolean,
    message: string,
    data: T | null = null,
    meta?: Record<string, unknown>
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    if (meta !== undefined) this.meta = meta;
  }

  // ── Convenience static factories ──────────────
  static success<T>(
    message: string,
    data: T | null = null,
    meta?: Record<string, unknown>
  ): ApiResponse<T> {
    return new ApiResponse<T>(true, message, data, meta);
  }

  static error(
    message: string,
    data: null = null
  ): ApiResponse<null> {
    return new ApiResponse<null>(false, message, data);
  }

  toJSON(): ApiResponseShape<T> {
    const obj: ApiResponseShape<T> = {
      success: this.success,
      message: this.message,
      data: this.data,
    };
    if (this.meta !== undefined) obj.meta = this.meta;
    return obj;
  }
}
