import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventEmitter } from "../event-emitter";

describe("EventEmitter", () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe("on() - add listeners", () => {
    it("adds a listener for an event", () => {
      const listener = vi.fn();
      emitter.on("test", listener);
      emitter.emit("test", { foo: "bar" });
      expect(listener).toHaveBeenCalledWith({ foo: "bar" });
    });

    it("allows multiple listeners for the same event", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      emitter.on("test", listener1);
      emitter.on("test", listener2);
      emitter.emit("test", "data");
      expect(listener1).toHaveBeenCalledWith("data");
      expect(listener2).toHaveBeenCalledWith("data");
    });

    it("allows different listeners for different events", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      emitter.on("event1", listener1);
      emitter.on("event2", listener2);
      emitter.emit("event1", "data1");
      expect(listener1).toHaveBeenCalledWith("data1");
      expect(listener2).not.toHaveBeenCalled();
    });

    it("does not add duplicate listeners for the same event", () => {
      const listener = vi.fn();
      emitter.on("test", listener);
      emitter.on("test", listener);
      emitter.emit("test", "data");
      // Should only be called once since Set prevents duplicates
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("off() - remove listeners", () => {
    it("removes a listener for an event", () => {
      const listener = vi.fn();
      emitter.on("test", listener);
      emitter.off("test", listener);
      emitter.emit("test", "data");
      expect(listener).not.toHaveBeenCalled();
    });

    it("removes only the specified listener", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      emitter.on("test", listener1);
      emitter.on("test", listener2);
      emitter.off("test", listener1);
      emitter.emit("test", "data");
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith("data");
    });

    it("does nothing if listener not registered", () => {
      const listener = vi.fn();
      emitter.off("test", listener);
      emitter.emit("test", "data");
      expect(listener).not.toHaveBeenCalled();
    });

    it("does nothing if event has no listeners", () => {
      const listener = vi.fn();
      emitter.off("nonexistent", listener);
      // Should not throw
    });
  });

  describe("emit() - call listeners", () => {
    it("calls all listeners with the provided data", async () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      emitter.on("test", listener1);
      emitter.on("test", listener2);
      await emitter.emit("test", { value: 123 });
      expect(listener1).toHaveBeenCalledWith({ value: 123 });
      expect(listener2).toHaveBeenCalledWith({ value: 123 });
    });

    it("handles async listeners correctly", async () => {
      const results: string[] = [];
      const listener1 = async (data: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(`listener1: ${data}`);
      };
      const listener2 = async (data: string) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        results.push(`listener2: ${data}`);
      };
      emitter.on("test", listener1);
      emitter.on("test", listener2);
      await emitter.emit("test", "async-data");
      expect(results).toContain("listener1: async-data");
      expect(results).toContain("listener2: async-data");
      expect(results).toHaveLength(2);
    });

    it("handles sync listeners correctly", async () => {
      const results: string[] = [];
      const listener = (data: string) => {
        results.push(data);
      };
      emitter.on("test", listener);
      await emitter.emit("test", "sync-data");
      expect(results).toEqual(["sync-data"]);
    });

    it("handles mix of sync and async listeners", async () => {
      const results: string[] = [];
      const syncListener = (data: string) => {
        results.push(`sync: ${data}`);
      };
      const asyncListener = async (data: string) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        results.push(`async: ${data}`);
      };
      emitter.on("test", syncListener);
      emitter.on("test", asyncListener);
      await emitter.emit("test", "mixed-data");
      expect(results).toContain("sync: mixed-data");
      expect(results).toContain("async: mixed-data");
      expect(results).toHaveLength(2);
    });

    it("does nothing if no listeners registered for event", async () => {
      await emitter.emit("nonexistent", "data");
      // Should not throw
    });

    it("isolates errors in one listener from others", async () => {
      const listener1 = vi.fn(() => {
        throw new Error("Listener 1 error");
      });
      const listener2 = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      emitter.on("test", listener1);
      emitter.on("test", listener2);
      await emitter.emit("test", "data");

      expect(listener1).toHaveBeenCalledWith("data");
      expect(listener2).toHaveBeenCalledWith("data");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error in event listener for test:"),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("isolates async errors in one listener from others", async () => {
      const listener1 = vi.fn(async () => {
        throw new Error("Async listener error");
      });
      const listener2 = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      emitter.on("test", listener1);
      emitter.on("test", listener2);
      await emitter.emit("test", "data");

      expect(listener1).toHaveBeenCalledWith("data");
      expect(listener2).toHaveBeenCalledWith("data");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error in event listener for test:"),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("removeAllListeners() - clear listeners", () => {
    it("removes all listeners for a specific event", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();
      emitter.on("test1", listener1);
      emitter.on("test1", listener2);
      emitter.on("test2", listener3);
      emitter.removeAllListeners("test1");
      emitter.emit("test1", "data1");
      emitter.emit("test2", "data2");
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).toHaveBeenCalledWith("data2");
    });

    it("removes all listeners for all events when no event specified", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      emitter.on("test1", listener1);
      emitter.on("test2", listener2);
      emitter.removeAllListeners();
      emitter.emit("test1", "data1");
      emitter.emit("test2", "data2");
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it("does nothing if event has no listeners", () => {
      emitter.removeAllListeners("nonexistent");
      // Should not throw
    });
  });

  describe("type safety", () => {
    it("supports typed event data", async () => {
      interface TestData {
        id: number;
        name: string;
      }
      const listener = vi.fn<[TestData], void>();
      emitter.on<TestData>("test", listener);
      await emitter.emit<TestData>("test", { id: 1, name: "test" });
      expect(listener).toHaveBeenCalledWith({ id: 1, name: "test" });
    });

    it("supports different data types for different events", async () => {
      const stringListener = vi.fn<[string], void>();
      const numberListener = vi.fn<[number], void>();
      emitter.on<string>("string-event", stringListener);
      emitter.on<number>("number-event", numberListener);
      await emitter.emit<string>("string-event", "hello");
      await emitter.emit<number>("number-event", 42);
      expect(stringListener).toHaveBeenCalledWith("hello");
      expect(numberListener).toHaveBeenCalledWith(42);
    });
  });
});
