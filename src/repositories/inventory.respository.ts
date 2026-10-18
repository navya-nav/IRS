import { Mutex } from "async-mutex";
import { randomUUID } from "crypto";
import { Reservation } from "../models/Reservation";
import { ApiError, ErrorCode } from "../types/ApiError";
import { ReservationStatus } from "../enums/ReservationStatus";


export class InventoryRepository {
    private readonly mutex = new Mutex();

    private totalStock = 100;
    private soldStock = 0;
    private reservedStock = 0;

    private readonly reservations =
        new Map<string, Reservation>();

    async createReservation(
        userId: string
    ): Promise<Reservation> {
        return this.mutex.runExclusive(async () => {

            const availableStock =
                this.totalStock -
                this.soldStock -
                this.reservedStock;

            if (availableStock <= 0) {
                throw new ApiError(
                    409,
                    ErrorCode.INVENTORY_OUT_OF_STOCK,
                    "Inventory unavailable"
                );
            }

            const reservation: Reservation = {
                id: randomUUID(),
                userId,
                status: ReservationStatus.ACTIVE,
                createdAt: new Date()
            };

            this.reservedStock++;

            this.reservations.set(
                reservation.id,
                reservation
            );

            return reservation;
        });
    }

    async getReservation(
        id: string
    ): Promise<Reservation> {

        const reservation =
            this.reservations.get(id);

        if (!reservation) {
            throw new ApiError(
                404,
                ErrorCode.RESERVATION_NOT_FOUND,
                "Reservation not found"
            );
        }

        return reservation;
    }

    async confirmReservation(
        id: string
    ): Promise<Reservation> {

        return this.mutex.runExclusive(async () => {

            const reservation =
                await this.getReservation(id);

            if (
                reservation.status !==
                ReservationStatus.ACTIVE
            ) {
                throw new ApiError(
                    409,
                    ErrorCode.INVALID_RESERVATION_STATE,
                    "Reservation not active"
                );
            }

            reservation.status =
                ReservationStatus.CONFIRMED;

            this.reservedStock--;
            this.soldStock++;

            return reservation;
        });
    }

    async cancelReservation(
        id: string
    ): Promise<Reservation> {

        return this.mutex.runExclusive(async () => {

            const reservation =
                await this.getReservation(id);

            if (
                reservation.status !==
                ReservationStatus.ACTIVE
            ) {
                throw new ApiError(
                    409,
                    ErrorCode.INVALID_RESERVATION_STATE,
                    "Reservation not active"
                );
            }

            reservation.status =
                ReservationStatus.CANCELLED;

            this.reservedStock--;

            return reservation;
        });
    }

    async expireReservation(
        id: string
    ): Promise<void> {

        await this.mutex.runExclusive(async () => {

            const reservation =
                this.reservations.get(id);

            if (
                !reservation ||
                reservation.status !==
                    ReservationStatus.ACTIVE
            ) {
                return;
            }

            reservation.status =
                ReservationStatus.EXPIRED;

            this.reservedStock--;
        });
    }

    getInventoryStatus() {
        return {
            totalStock: this.totalStock,
            soldStock: this.soldStock,
            reservedStock: this.reservedStock,
            availableStock:
                this.totalStock -
                this.soldStock -
                this.reservedStock
        };
    }

    async reset(stock = 1) {

        await this.mutex.runExclusive(
            async () => {
                this.totalStock = stock;
                this.soldStock = 0;
                this.reservedStock = 0;

                this.reservations.clear();
            }
        );
    }
}

export const inventoryRepository =
    new InventoryRepository();