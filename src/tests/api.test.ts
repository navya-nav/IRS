import request from "supertest";
import app from "../app";
import InventoryService from "../services/InventoryService";
import { inventoryConfig } from "../config/inventory";

describe("API Contract", () => {
  beforeEach(async () => {
    await InventoryService.reset(1);
  });

  it("should return 400 for missing userId", async () => {
    const res = await request(app)
      .post("/inventory/reserve")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should return 400 for malformed UUID in confirm", async () => {
    const res = await request(app)
      .post("/inventory/confirm/not-a-uuid")
      .send();
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("should ignore extra fields in reserve", async () => {
    const res = await request(app)
      .post("/inventory/reserve")
      .send({ userId: "user5", extra: "field" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("id");
  });

  it("should return correct status shape", async () => {
    const res = await request(app)
      .get("/inventory/status");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("totalStock");
    expect(res.body.data).toHaveProperty("reservedStock");
    expect(res.body.data).toHaveProperty("soldStock");
    expect(res.body.data).toHaveProperty("availableStock");
  });

  it("should return reservation status after confirm", async () => {
    const reservation = await InventoryService.reserve("user6");
    await InventoryService.confirm(reservation.id);

    const res = await request(app)
      .get(`/inventory/reservations/${reservation.id}/status`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(reservation.id);
    expect(res.body.data.status).toBe("CONFIRMED");
  });

  it("should return reservation status after cancel", async () => {
    const reservation = await InventoryService.reserve("user7");
    await InventoryService.cancel(reservation.id);

    const res = await request(app)
      .get(`/inventory/reservations/${reservation.id}/status`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(reservation.id);
    expect(res.body.data.status).toBe("CANCELLED");
  });

  it("should return reservation status after expiry", async () => {
    jest.useFakeTimers();

    const reservation = await InventoryService.reserve("user8");
    jest.advanceTimersByTime(
      inventoryConfig.reservationHoldMs
    );

    const res = await request(app)
      .get(`/inventory/reservations/${reservation.id}/status`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(reservation.id);
    expect(res.body.data.status).toBe("EXPIRED");

    jest.useRealTimers();
  });

  it("should return 404 for missing reservation status", async () => {
    const res = await request(app)
      .get("/inventory/reservations/123e4567-e89b-12d3-a456-426614174000/status");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("RESERVATION_NOT_FOUND");
  });
});
