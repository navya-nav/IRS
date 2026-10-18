import { logger } from "../config/logger";

type ExpireReservationCallback = (
	reservationId: string
) => Promise<void>;

class ReservationCleanupService {
	private readonly timers =
		new Map<string, NodeJS.Timeout>();

	schedule(
		reservationId: string,
		holdDurationMs: number,
		onExpire: ExpireReservationCallback
	) {
		this.cancel(reservationId);

		logger.info(
			"Scheduling reservation expiry",
			{
				reservationId,
				holdDurationMs,
				activeTimers: this.timers.size + 1
			}
		);

		const timer = setTimeout(() => {
			this.timers.delete(reservationId);

			logger.info(
				"Running reservation expiry callback",
				{ reservationId }
			);

			void onExpire(reservationId).catch(error => {
				logger.error(
					"Reservation expiry failed",
					{
						reservationId,
						error
					}
				);
			});
		}, holdDurationMs);

		timer.unref?.();

		this.timers.set(
			reservationId,
			timer
		);
	}

	cancel(reservationId: string) {
		const timer =
			this.timers.get(reservationId);

		if (!timer) {
			logger.info(
				"No reservation expiry timer to cancel",
				{ reservationId }
			);
			return;
		}

		clearTimeout(timer);
		this.timers.delete(reservationId);

		logger.info(
			"Cancelled reservation expiry timer",
			{
				reservationId,
				activeTimers: this.timers.size
			}
		);
	}

	cancelAll() {
		logger.info(
			"Cancelling all reservation expiry timers",
			{ activeTimers: this.timers.size }
		);

		this.timers.forEach(timer => {
			clearTimeout(timer);
		});

		this.timers.clear();
	}
}

export const reservationCleanupService =
	new ReservationCleanupService();
