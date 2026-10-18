import { Router } from "express";
import {
    ReserveInventorySchema,
    ReservationIdSchema
}
from "../schemas/inventory.schema";
import { InventoryController } from "../controllers/InventoryController";
import { validate } from "../middleware/validateRequest";
import { asyncHandler } from "../utils/AsyncHandler";

const router = Router();
const controller = new InventoryController();

router.post(
    "/reserve",
    validate(ReserveInventorySchema),
    asyncHandler(
        controller.reserve.bind(controller)
    )
);

router.post(
    "/confirm/:id",
    validate(
        ReservationIdSchema,
        "params"
    ),
    asyncHandler(
        controller.confirm.bind(controller)
    )
);

router.post(
    "/cancel/:id",
    validate(
        ReservationIdSchema,
        "params"
    ),
    asyncHandler(
        controller.cancel.bind(controller)
    )
);

router.get(
    "/reservations/:id/status",
    validate(
        ReservationIdSchema,
        "params"
    ),
    asyncHandler(
        controller.reservationStatus.bind(controller)
    )
);

router.get(
    "/status",
    asyncHandler(
        controller.status.bind(controller)
    )
);

export default router;