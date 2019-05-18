/**
 * A collection with a (possible) infinite number of elements that can be
 * asynchronously iterated.
 * If the underlying implementation yields an infinite number of elements, it
 * can only be closed by calling the "close" method or breaking the "for await"
 * semantics.
 */
export interface InfiniteStream<T> extends AsyncIterableIterator<T> {
    close(): void;

    on(event: "ready", callback: () => void): void;
    on(event: "close", callback: () => void): void;
}
