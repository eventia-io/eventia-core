import { EventEmitter } from "events";

import { CircularBuffer } from "./CircularBuffer";
import { Logger } from "./Logger";
import { InfiniteStream } from "./InfiniteStream";


type ConsumerResolveCallback<T> = (value?: IteratorResult<T> | PromiseLike<IteratorResult<T>> | undefined) => void;
type PublisherResolveCallback = (value?: void | PromiseLike<void> | undefined) => void;

export class SubscribableStream<T> extends EventEmitter implements InfiniteStream<T> {

    protected readonly logger: Logger;
    protected readonly buffer: CircularBuffer<T>;

    protected resolveConsumer: ConsumerResolveCallback<T> | undefined;
    protected resolvePublish: PublisherResolveCallback | undefined;

    protected isClosed: boolean = false;

    public constructor(logger: Logger, capacity: number) {
        super();

        this.logger = logger;
        this.buffer = new CircularBuffer<T>(capacity);
    }

    public [Symbol.asyncIterator](): AsyncIterableIterator<T> {
        return this;
    }

    public next(): Promise<IteratorResult<T>> {
        // Notify the publisher that we're ready to accept new values
        this.awakePublisher();

        // If we have items in our buffer or the stream has been closed, yield immediately
        if (this.buffer.length > 0 || this.isClosed) {
            return Promise.resolve({ done: this.isClosed, value: this.buffer.read() });
        }

        // Otherwise ... we need to wait until the publisher feeds us some data
        return new Promise<IteratorResult<T>>((resolve): void => {
            this.resolveConsumer = resolve;
        });
    }

    public return(): Promise<IteratorResult<T>> {
        this.close();

        return Promise.resolve({
            done: true,
            value: undefined as unknown as T
        });
    }

    public publish(value: T): Promise<void> {
        if (this.isClosed === false) {
            // If the consumer is waiting for data, awake it
            if (this.awakeConsumer(value) === false) {
                // If it was busy, enqueue an item
                this.buffer.write(value);
            }

            // If the queue is full, wait until some elements are consumed
            if (this.buffer.capacity === 0) {
                return new Promise<void>((resolve): void => {
                    this.resolvePublish = resolve;
                });
            }
        }

        // Otherwise, exit immediately
        return Promise.resolve();
    }

    public close(): void {
        this.isClosed = true;

        this.awakePublisher();
        this.awakeConsumer((undefined as unknown) as T);

        this.emit("close");
    }

    protected awakePublisher(): void {
        if (this.resolvePublish !== undefined) {
            const fn = this.resolvePublish;
            this.resolvePublish = undefined;
            fn();
        }
    }

    protected awakeConsumer(value: T): boolean {
        if (this.resolveConsumer !== undefined) {
            const fn = this.resolveConsumer;
            this.resolveConsumer = undefined;
            fn({ done: this.isClosed, value: value });

            return true;
        }

        return false;
    }

}
