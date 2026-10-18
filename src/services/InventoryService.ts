import { Mutex } from "async-mutex";
import { randomUUID } from "crypto";

import { ReservationStatus } from "../enums/ReservationStatus";
import { Reservation } from "../models/Reservation";
import { logger } from "../config/logger";
import { ApiError, ErrorCode } from "../types/ApiError";
import { reservationCleanupService } from "./reservation-cleanup.service";
import { inventoryConfig } from "../config/inventory";

class InventoryService {

  private inventory = {
    totalStock: 1,
    reservedStock: 0,
    soldStock: 0
  };

  private reservations = new Map<string, Reservation>();

  private mutex = new Mutex();

  private getInventorySnapshot() {
    return {
      totalStock: this.inventory.totalStock,
      reservedStock: this.inventory.reservedStock,
      soldStock: this.inventory.soldStock,
      availableStock:
        this.inventory.totalStock -
        this.inventory.soldStock -
        this.inventory.reservedStock,
      reservationCount: this.reservations.size
    };
  }

  async reserve(userId: string): Promise<Reservation> {

    return this.mutex.runExclusive(async () => {

      logger.info("Attempting inventory reservation", {
        userId,
        inventory: this.getInventorySnapshot()
      });

      const availableStock =
        this.inventory.totalStock -
        this.inventory.soldStock -
        this.inventory.reservedStock;

      if (availableStock <= 0) {
       logger.warn("Reservation rejected - out of stock", {
    userId,
    inventory: this.getInventorySnapshot()
});
       throw new ApiError(
    409,
    ErrorCode.INVENTORY_OUT_OF_STOCK,
    "Inventory unavailable"
);
      }

      this.inventory.reservedStock++;

      const reservation: Reservation = {
        id: randomUUID(),
        userId,
        status: ReservationStatus.ACTIVE,
        createdAt: new Date(),
        expiresAt: new Date(
          Date.now() + inventoryConfig.reservationHoldMs
        )
      };

      this.reservations.set(reservation.id, reservation);

      logger.info("Reservation created", {
        reservationId: reservation.id,
        userId,
        expiresAt: reservation.expiresAt,
        inventory: this.getInventorySnapshot()
      });

      reservationCleanupService.schedule(
        reservation.id,
        inventoryConfig.reservationHoldMs,
        this.expireReservation.bind(this)
      );

      return reservation;
    });
  }

  async confirm(id: string) {

    return this.mutex.runExclusive(async () => {

      logger.info("Attempting reservation confirmation", {
        reservationId: id,
        inventory: this.getInventorySnapshot()
      });

      const reservation = this.reservations.get(id);

      if (!reservation) {
        logger.warn("Reservation confirmation failed - not found", {
          reservationId: id
        });
        throw new ApiError(
    404,
    ErrorCode.RESERVATION_NOT_FOUND,
    "Reservation not found"
);
      }

      if (reservation.status !== ReservationStatus.ACTIVE) {
     logger.warn("Reservation confirmation rejected - invalid state", {
   reservationId: id,
   status: reservation.status
});
       throw new ApiError(
    409,
    ErrorCode.INVALID_RESERVATION_STATE,
    "Reservation already processed"
);


      }

      reservation.status = ReservationStatus.CONFIRMED;

      reservationCleanupService.cancel(id);

      this.inventory.reservedStock--;
      this.inventory.soldStock++;

      logger.info("Reservation confirmed", {
        reservationId: id,
        userId: reservation.userId,
        inventory: this.getInventorySnapshot()
      });

      return reservation;
    });
  }

  async getReservationStatus(id: string) {

    return this.mutex.runExclusive(async () => {
      logger.info("Looking up reservation status", {
        reservationId: id
      });

      const reservation = this.reservations.get(id);

      if (!reservation) {
        logger.warn("Reservation status lookup failed - not found", {
          reservationId: id
        });
        throw new ApiError(
    404,
    ErrorCode.RESERVATION_NOT_FOUND,
    "Reservation not found"
);
      }

      logger.info("Reservation status lookup succeeded", {
        reservationId: id,
        status: reservation.status,
        expiresAt: reservation.expiresAt
      });

      return {
        id: reservation.id,
        userId: reservation.userId,
        status: reservation.status,
        createdAt: reservation.createdAt,
        expiresAt: reservation.expiresAt
      };
    });
  }

  async cancel(id: string) {

    return this.mutex.runExclusive(async () => {

      logger.info("Attempting reservation cancellation", {
        reservationId: id,
        inventory: this.getInventorySnapshot()
      });

      const reservation = this.reservations.get(id);

      if (!reservation) {
        logger.warn("Reservation cancellation failed - not found", {
          reservationId: id
        });
        throw new ApiError(
    404,
    ErrorCode.RESERVATION_NOT_FOUND,
    "Reservation not found"
);
      }

      if (reservation.status !== ReservationStatus.ACTIVE) {
        logger.warn("Reservation cancellation rejected - invalid state", {
          reservationId: id,
          status: reservation.status
        });
        throw new ApiError(
    409,
    ErrorCode.INVALID_RESERVATION_STATE,
    "Reservation cannot be cancelled"
);
      }

      reservation.status = ReservationStatus.CANCELLED;

      reservationCleanupService.cancel(id);

      this.inventory.reservedStock--;

      logger.info("Reservation cancelled", {
        reservationId: id,
        userId: reservation.userId,
        inventory: this.getInventorySnapshot()
      });

      return reservation;
    });
  }

  private async expireReservation(id: string) {

    await this.mutex.runExclusive(async () => {
      const reservation = this.reservations.get(id);

      if (
        !reservation ||
        reservation.status !== ReservationStatus.ACTIVE
      ) {
        logger.info("Reservation expiry skipped", {
          reservationId: id,
          status: reservation?.status ?? "MISSING"
        });
        return;
      }

      reservation.status = ReservationStatus.EXPIRED;

      this.inventory.reservedStock--;

      logger.info("Reservation expired", {
        reservationId: id,
        userId: reservation.userId,
        inventory: this.getInventorySnapshot()
      });
    });
  }

  async reset(totalStock = 1) {

    await this.mutex.runExclusive(async () => {
      logger.info("Resetting inventory service state", {
        nextTotalStock: totalStock,
        previousInventory: this.getInventorySnapshot()
      });

      this.inventory = {
        totalStock,
        reservedStock: 0,
        soldStock: 0
      };

      this.reservations.clear();
      reservationCleanupService.cancelAll();

      logger.info("Inventory service state reset complete", {
        inventory: this.getInventorySnapshot()
      });
    });
  }

  getInventoryStatus() {

    const snapshot = this.getInventorySnapshot();

    logger.info("Inventory status requested", {
      inventory: snapshot
    });

    return {
      totalStock: snapshot.totalStock,
      soldStock: snapshot.soldStock,
      reservedStock: snapshot.reservedStock,
      availableStock: snapshot.availableStock
    };
  }
}

export default new InventoryService();