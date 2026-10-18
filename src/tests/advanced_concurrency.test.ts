import InventoryService from "../services/InventoryService";
import { inventoryConfig } from "../config/inventory";

describe("Advanced Concurrency", () => {
  beforeEach(async () => {
    await InventoryService.reset(1);
  });

  it("should allow only one cancel on same reservation", async () => {
    const res = await InventoryService.reserve("user1");
    const cancelPromises = Array.from({ length: 10 }).map(() =>
      InventoryService.cancel(res.id).then(() => "success").catch(() => "fail")
    );
    const results = await Promise.all(cancelPromises);
    expect(results.filter(x => x === "success").length).toBe(1);
    expect(results.filter(x => x === "fail").length).toBe(9);
  });

  it("should allow only one confirm on same reservation", async () => {
    const res = await InventoryService.reserve("user2");
    const confirmPromises = Array.from({ length: 10 }).map(() =>
      InventoryService.confirm(res.id).then(() => "success").catch(() => "fail")
    );
    const results = await Promise.all(confirmPromises);
    expect(results.filter(x => x === "success").length).toBe(1);
    expect(results.filter(x => x === "fail").length).toBe(9);
  });

  it("should not allow confirm after expiry in race", async () => {
    jest.useFakeTimers();
    const res = await InventoryService.reserve("user3");
    jest.advanceTimersByTime(
      inventoryConfig.reservationHoldMs
    );
    await expect(InventoryService.confirm(res.id)).rejects.toThrow();
    jest.useRealTimers();
  });
});
