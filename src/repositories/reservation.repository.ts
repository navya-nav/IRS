// repositories/reservation.repository.ts

import { Reservation } from "../models/Reservation";

export class ReservationRepository {

  private reservations = new Map<string, Reservation>();

  save(reservation: Reservation) {
    this.reservations.set(
      reservation.id,
      reservation
    );
  }

  findById(id: string) {
    return this.reservations.get(id);
  }

  getAll() {
    return [...this.reservations.values()];
  }
}