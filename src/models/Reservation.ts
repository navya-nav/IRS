import { ReservationStatus } from "../enums/ReservationStatus";

export interface Reservation {
    id: string;
    userId: string;
    status: ReservationStatus;
    createdAt: Date;
    expiresAt: Date;
}