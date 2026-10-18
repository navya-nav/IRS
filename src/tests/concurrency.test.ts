import InventoryService from "../services/InventoryService";


describe("Concurrency", () => {

    beforeEach(async () => {
        await InventoryService.reset(1);
    });

    it("should allow only one reservation",
    async () => {

        const requests =
            Array.from(
                { length: 500 }
            ).map((_, i) =>
                InventoryService
                    .reserve(`user-${i}`)
                    .then(() => "success")
                    .catch(() => "failed")
            );

        const results =
            await Promise.all(requests);

        expect(
            results.filter(
                x => x === "success"
            ).length
        ).toBe(1);

        expect(
            results.filter(
                x => x === "failed"
            ).length
        ).toBe(499);
    });
});