import InventoryService from "../services/InventoryService";
import { ApiError, ErrorCode } from "../types/ApiError";

describe("Error Handling", () => {
  beforeEach(async () => {
    await InventoryService.reset(1);
  });

  it("should throw ApiError for invalid reservation id on confirm", async () => {
    await expect(InventoryService.confirm("invalid-id")).rejects.toThrow(ApiError);
  });

  it("should throw ApiError for invalid reservation id on cancel", async () => {
    await expect(InventoryService.cancel("invalid-id")).rejects.toThrow(ApiError);
  });

  it("should throw INVENTORY_OUT_OF_STOCK error", async () => {
    await InventoryService.reserve("user1");
    await expect(InventoryService.reserve("user2")).rejects.toThrowError(ErrorCode.INVENTORY_OUT_OF_STOCK);
  });

  it("should throw INVALID_RESERVATION_STATE error on double confirm", async () => {
    const res = await InventoryService.reserve("user3");
    await InventoryService.confirm(res.id);
    await expect(InventoryService.confirm(res.id)).rejects.toThrowError(ErrorCode.INVALID_RESERVATION_STATE);
  });
});
