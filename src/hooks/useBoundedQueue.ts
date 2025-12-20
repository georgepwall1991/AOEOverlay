import { useRef, useCallback } from "react";

/**
 * Hook that manages a bounded queue with maximum size.
 *
 * @param maxSize - Maximum number of items in the queue
 * @returns Queue operations: push, shift, clear, isEmpty, isFull, size
 *
 * When the queue is full, pushing a new item drops the oldest item.
 * Useful for managing message queues, TTS queues, etc. where
 * unbounded growth could cause memory issues.
 */
export function useBoundedQueue<T>(maxSize: number) {
  const queueRef = useRef<T[]>([]);

  const push = useCallback(
    (item: T) => {
      if (queueRef.current.length >= maxSize) {
        // Queue is full - drop oldest item
        queueRef.current.shift();
      }
      queueRef.current.push(item);
    },
    [maxSize]
  );

  const shift = useCallback((): T | undefined => {
    return queueRef.current.shift();
  }, []);

  const clear = useCallback(() => {
    queueRef.current = [];
  }, []);

  const isEmpty = useCallback(() => {
    return queueRef.current.length === 0;
  }, []);

  const isFull = useCallback(() => {
    return queueRef.current.length >= maxSize;
  }, [maxSize]);

  const size = useCallback(() => {
    return queueRef.current.length;
  }, []);

  return {
    push,
    shift,
    clear,
    isEmpty,
    isFull,
    size,
  };
}
