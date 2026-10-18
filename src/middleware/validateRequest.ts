import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { logger } from "../config/logger";

export const validate =
    (
        schema: ZodSchema,
        source: "body" | "params" = "body"
    ) =>
    (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            schema.parse(req[source]);
            logger.info("Validation passed", {
                method: req.method,
                path: req.originalUrl,
                source
            });
            next();
        } catch (error) {
            logger.warn("Validation failed", {
                method: req.method,
                path: req.originalUrl,
                source
            });
            next(error);
        }
    };