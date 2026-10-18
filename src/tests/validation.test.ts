import { z } from "zod";
import { ReserveInventorySchema, ReservationIdSchema } from "../schemas/inventory.schema";

describe("Validation: ReserveInventorySchema", () => {
  it("should fail for empty userId", () => {
    expect(() => ReserveInventorySchema.parse({ userId: "" })).toThrow();
  });

  it("should fail for short userId", () => {
    expect(() => ReserveInventorySchema.parse({ userId: "ab" })).toThrow();
  });

  it("should fail for long userId", () => {
    expect(() => ReserveInventorySchema.parse({ userId: "a".repeat(51) })).toThrow();
  });

  it("should trim and fail for whitespace userId", () => {
    expect(() => ReserveInventorySchema.parse({ userId: "   " })).toThrow();
  });

  it("should pass for valid userId", () => {
    expect(() => ReserveInventorySchema.parse({ userId: "validUser" })).not.toThrow();
  });
});

describe("Validation: ReservationIdSchema", () => {
  it("should fail for non-uuid id", () => {
    expect(() => ReservationIdSchema.parse({ id: "not-a-uuid" })).toThrow();
  });

  it("should pass for valid uuid", () => {
    expect(() => ReservationIdSchema.parse({ id: "123e4567-e89b-12d3-a456-426614174000" })).not.toThrow();
  });
});
