import "dotenv/config";

const DEFAULT_RESERVATION_HOLD_MS =
    60000;

function parseReservationHoldMs() {
    const rawValue =
        process.env.RESERVATION_HOLD_MS;

    if (!rawValue) {
        return DEFAULT_RESERVATION_HOLD_MS;
    }

    const parsedValue = Number(rawValue);

    if (
        !Number.isFinite(parsedValue) ||
        parsedValue <= 0
    ) {
        return DEFAULT_RESERVATION_HOLD_MS;
    }

    return parsedValue;
}

export const inventoryConfig = {
    reservationHoldMs:
        parseReservationHoldMs()
};