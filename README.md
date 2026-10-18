Inventory Reservation System
Overview
This project implements a simple inventory reservation API in TypeScript with Express.
The main goal is to allow clients to:
reserve inventory for a short hold window
confirm a reservation and convert it into a sale
cancel a reservation and release stock
inspect inventory totals
inspect a reservation's current status
Approach Used
The implementation is intentionally lightweight and keeps all runtime state in memory.
Core design
A singleton service in `src/services/InventoryService.ts` owns the inventory state and reservation map.
`totalStock`, `reservedStock`, and `soldStock` are tracked in memory.
Reservations are stored in an in-memory `Map`, keyed by reservation id.
Stock availability is derived as:
`availableStock = totalStock - reservedStock - soldStock`
Concurrency handling
The service uses `async-mutex` to serialize critical operations.
`reserve`, `confirm`, `cancel`, and expiry handling all run through the same mutex.
This prevents race conditions such as overselling stock or double-confirming a reservation.
Reservation lifecycle
`reserve` creates a reservation in `ACTIVE` state and increments `reservedStock`.
`confirm` moves a reservation from `ACTIVE` to `CONFIRMED`, decrements `reservedStock`, and increments `soldStock`.
`cancel` moves a reservation from `ACTIVE` to `CANCELLED` and releases reserved stock.
Expiry moves a reservation from `ACTIVE` to `EXPIRED` and also releases reserved stock.
Expiry handling
Expiry timers are managed by `src/services/reservation-cleanup.service.ts`.
Each reservation gets a timeout scheduled at creation time.
When the timer fires, the service attempts to expire the reservation safely under the mutex.
Logging
Logging is handled through Winston in `src/config/logger.ts`.
Logs are written to both console and `logs/app.log`.
Structured logs include reservation ids, statuses, and inventory snapshots for easier debugging.
Assumptions
This is a single-process application.
In-memory state is acceptable for the scope of the challenge.
Stock and reservations do not need to survive a server restart.
A reservation hold should automatically expire after a configurable timeout if not confirmed.
Validation errors and business rule violations should return structured API errors.
Important Trade-Offs
Because state is stored only in memory:
restarting the server resets stock counters and removes all reservations
scheduled expiry timers are lost on restart
the system is not horizontally scalable as-is across multiple app instances
For production use, the next step would be to persist reservations and stock in a database and move expiry management to a durable scheduler or background worker.
Configuration
Current runtime config is loaded from environment variables.
`RESERVATION_HOLD_MS`: hold duration before an active reservation expires
Default value in the current implementation:
`60000` milliseconds
Example:
```env
RESERVATION_HOLD_MS=60000
```
API Summary
Reserve inventory
`POST /inventory/reserve`
body:
```json
{
"userId": "user-123"
}
```
Confirm reservation
`POST /inventory/confirm/:id`
Cancel reservation
`POST /inventory/cancel/:id`
Get inventory totals
`GET /inventory/status`
Response includes:
`totalStock`
`reservedStock`
`soldStock`
`availableStock`
Get reservation status
`GET /inventory/reservations/:id/status`
Response includes:
`id`
`userId`
`status`
`createdAt`
`expiresAt`
How In-Memory Stock Works
The current stock state lives inside `InventoryService`.
`totalStock` is the total amount available in the system
`reservedStock` is the amount currently held by active reservations
`soldStock` is the amount already confirmed
At runtime, only one service instance owns that state, so all requests share the same counters while the process is alive.
Where To Change Stock / Hold Settings
Change hold duration
Set the environment variable:
env
RESERVATION_HOLD_MS=60000

This resets the in-memory state to a known total stock value and clears reservations and timers.
Change default startup stock
The current default startup value is initialized directly inside `src/services/InventoryService.ts`.
Running the Project
Install dependencies:

npm install

Start in dev mode

npm start
