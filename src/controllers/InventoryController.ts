import { Request, Response } from "express";
import InventoryService from "../services/InventoryService";
import { logger } from "../config/logger";

export class InventoryController {

    async reserve(
        req: Request,
        res: Response
    ) {
        const userId = req.body.userId;
        logger.info("POST /reserve - request received", { userId });

        const result =
            await InventoryService.reserve(userId);

        logger.info("POST /reserve - success", {
            userId,
            reservationId: result.id
        });

        return res.status(201).json({
            success: true,
            data: result
        });
    }

    async confirm(
        req: Request,
        res: Response
    ) {
        const id = req.params.id as string;
        logger.info("POST /confirm - request received", { reservationId: id });

        const result =
            await InventoryService.confirm(id);

        logger.info("POST /confirm - success", {
            reservationId: id,
            status: result.status
        });

        return res.json({
            success: true,
            data: result
        });
    }

    async cancel(
        req: Request,
        res: Response
    ) {
        const id = req.params.id as string;
        logger.info("POST /cancel - request received", { reservationId: id });

        const result =
            await InventoryService.cancel(id);

        logger.info("POST /cancel - success", {
            reservationId: id,
            status: result.status
        });

        return res.json({
            success: true,
            data: result
        });
    }

    async reservationStatus(
        req: Request,
        res: Response
    ) {
        const id = req.params.id as string;
        logger.info(
            "GET /reservations/:id/status - request received",
            { reservationId: id }
        );

        const result =
            await InventoryService.getReservationStatus(id);

        logger.info(
            "GET /reservations/:id/status - success",
            {
                reservationId: id,
                status: result.status
            }
        );

        return res.json({
            success: true,
            data: result
        });
    }

    async status(
        req: Request,
        res: Response
    ) {
        logger.info("GET /status - request received");

        const data = InventoryService.getInventoryStatus();

        logger.info("GET /status - success", data);

        return res.json({
            success: true,
            data
        });
    }
}