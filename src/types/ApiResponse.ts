export interface SuccessResponse<T> {
    success: true;
    data: T;
}

export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}