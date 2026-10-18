import {
    Request,
    Response,
    NextFunction
} from "express";

import { ZodError } from "zod";
import { ApiError } from "../types/ApiError";
import { logger } from "../config/logger";

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {

    if (err instanceof ZodError) {

        logger.warn("Request failed - validation error", {
            method: req.method,
            path: req.originalUrl,
            issues: err.issues
        });

        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                details: err.issues
            }
        });
    }

    if (err instanceof ApiError) {

        logger.warn("Request failed - api error", {
            method: req.method,
            path: req.originalUrl,
            statusCode: err.statusCode,
            code: err.code,
            message: err.message
        });

        return res.status(
            err.statusCode
        ).json({
            success: false,
            error: {
                code: err.code,
                message: err.message
            }
        });
    }

    logger.error("Request failed - unexpected error", {
        method: req.method,
        path: req.originalUrl,
        message: err.message,
        stack: err.stack
    });

    return res.status(500).json({
        success: false,
        error: {
            code:
              "INTERNAL_SERVER_ERROR",
            message:
              "Unexpected error"
        }
    });
};