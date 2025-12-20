/**
 * Event listener function type
 * @template T The type of data passed to the listener
 */
export type EventListener<T = any> = (data: T) => void | Promise<void>;

/**
 * EventEmitter class for decoupling metric collection from streaming/storage.
 * Implements publish-subscribe pattern for event-driven architecture.
 *
 * Features:
 * - Multiple listeners per event
 * - Support for both sync and async listeners
 * - Error isolation between listeners
 * - Type-safe event data
 *
 * @example
 * ```typescript
 * const emitter = new EventEmitter();
 *
 * // Subscribe to events
 * emitter.on('metric', (data) => console.log('Metric:', data));
 * emitter.on('metric', async (data) => await saveToDatabase(data));
 *
 * // Emit events
 * await emitter.emit('metric', { tokens: 100, cost: 0.05 });
 *
 * // Cleanup
 * emitter.removeAllListeners('metric');
 * ```
 */
export class EventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();

  /**
   * Subscribe to an event
   * @param event The event name to listen for
   * @param listener The listener function to call when the event is emitted
   * @template T The type of data passed to the listener
   */
  on<T = any>(event: string, listener: EventListener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Unsubscribe from an event
   * @param event The event name to stop listening for
   * @param listener The listener function to remove
   * @template T The type of data passed to the listener
   */
  off<T = any>(event: string, listener: EventListener<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * Emit an event to all listeners
   * Executes all listeners concurrently and waits for all to complete.
   * Errors in individual listeners are caught, logged, and isolated.
   *
   * @param event The event name to emit
   * @param data The data to pass to all listeners
   * @template T The type of data to pass to listeners
   * @returns Promise that resolves when all listeners have completed
   */
  async emit<T = any>(event: string, data: T): Promise<void> {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      return;
    }

    // Execute all listeners (async or sync)
    const promises = Array.from(eventListeners).map((listener) => {
      try {
        return Promise.resolve(listener(data)).catch((error) => {
          console.error(`Error in event listener for ${event}:`, error);
        });
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  /**
   * Clear all listeners for an event or all events
   * @param event Optional event name. If not provided, clears all listeners for all events.
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
