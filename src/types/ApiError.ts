export enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVENTORY_OUT_OF_STOCK = "INVENTORY_OUT_OF_STOCK",
    RESERVATION_NOT_FOUND = "RESERVATION_NOT_FOUND",
    INVALID_RESERVATION_STATE = "INVALID_RESERVATION_STATE",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
}

export class ApiError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly code: ErrorCode,
        message: string
    ) {
        super(message);
    }
}