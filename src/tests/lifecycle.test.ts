import InventoryService from "../services/InventoryService";
import { inventoryConfig } from "../config/inventory";

describe("Reservation Lifecycle", () => {
  let reservationId: string;

  beforeEach(async () => {
    await InventoryService.reset(2);
  });

  it("should not allow double confirm", async () => {
    const res = await InventoryService.reserve("user1");
    reservationId = res.id;
    await InventoryService.confirm(reservationId);
    await expect(InventoryService.confirm(reservationId)).rejects.toThrow();
  });

  it("should not allow confirm after cancel", async () => {
    const res = await InventoryService.reserve("user2");
    reservationId = res.id;
    await InventoryService.cancel(reservationId);
    await expect(InventoryService.confirm(reservationId)).rejects.toThrow();
  });

  it("should not allow cancel after confirm", async () => {
    const res = await InventoryService.reserve("user3");
    reservationId = res.id;
    await InventoryService.confirm(reservationId);
    await expect(InventoryService.cancel(reservationId)).rejects.toThrow();
  });

  it("should expire reservation after timeout", async () => {
    jest.useFakeTimers();
    const res = await InventoryService.reserve("user4");
    reservationId = res.id;
    jest.advanceTimersByTime(
      inventoryConfig.reservationHoldMs
    );
    await expect(
      InventoryService.confirm(reservationId)
    ).rejects.toThrow();
    jest.useRealTimers();
  });
});
