// utils/mutex.manager.ts

import { Mutex } from "async-mutex";

export class MutexManager {

  private mutexMap = new Map<string, Mutex>();

  getMutex(productId: string): Mutex {

    if (!this.mutexMap.has(productId)) {
      this.mutexMap.set(productId, new Mutex());
    }

    return this.mutexMap.get(productId)!;
  }
}