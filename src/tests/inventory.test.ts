import InventoryService from "../services/InventoryService";
import { ReservationStatus } from "../enums/ReservationStatus";
import { inventoryConfig } from "../config/inventory";

describe("Inventory State Transitions", () => {
  beforeEach(async () => {
    await InventoryService.reset(2);
  });

  it("should update stock after confirm", async () => {
    const res = await InventoryService.reserve("user1");
    await InventoryService.confirm(res.id);
    const status = InventoryService.getInventoryStatus();
    expect(status.soldStock).toBe(1);
    expect(status.reservedStock).toBe(0);
    expect(status.availableStock).toBe(1);
  });

  it("should update stock after cancel", async () => {
    const res = await InventoryService.reserve("user2");
    await InventoryService.cancel(res.id);
    const status = InventoryService.getInventoryStatus();
    expect(status.soldStock).toBe(0);
    expect(status.reservedStock).toBe(0);
    expect(status.availableStock).toBe(2);
  });

  it("should update stock after expiry", async () => {
    jest.useFakeTimers();
    const res = await InventoryService.reserve("user3");
    expect(res.expiresAt).toBeInstanceOf(Date);
    jest.advanceTimersByTime(
      inventoryConfig.reservationHoldMs
    );
    const status = InventoryService.getInventoryStatus();
    expect(status.soldStock).toBe(0);
    expect(status.reservedStock).toBe(0);
    expect(status.availableStock).toBe(2);
    jest.useRealTimers();
  });

  it("should not allow reserved + sold > total", async () => {
    const res = await InventoryService.reserve("user4");
    await InventoryService.confirm(res.id);
    const status = InventoryService.getInventoryStatus();
    expect(status.soldStock + status.reservedStock).toBeLessThanOrEqual(status.totalStock);
  });
});
