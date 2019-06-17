import { EventEmitter } from "events";

import { InfiniteStream } from "../../Infrastructure/InfiniteStream";
import { TrackedDomainEventMessage } from "../../EventHandling/TrackedDomainEventMessage";
import { TrackingToken } from "../../EventHandling/TrackingToken";
import { Logger } from "../../Infrastructure/Logger";


export class InMemoryEventStorageQuery extends EventEmitter implements InfiniteStream<TrackedDomainEventMessage> {

    protected readonly logger: Logger;
    protected readonly events: TrackedDomainEventMessage[];
    protected readonly trackingToken: TrackingToken;
    protected closed: boolean;
    protected position: number;

    public constructor(logger: Logger, events: TrackedDomainEventMessage[], trackingToken: TrackingToken) {
        super();

        this.logger = logger;
        this.events = events;
        this.trackingToken = trackingToken;
        this.closed = false;
        this.position = 0;
    }

    public [Symbol.asyncIterator](): AsyncIterableIterator<TrackedDomainEventMessage> {
        return this;
    }

    public async next(): Promise<IteratorResult<TrackedDomainEventMessage>> {
        while (this.position < this.events.length && this.closed === false) {
            const event = this.events[this.position++];
            if (this.trackingToken.covers(event)) {
                return {
                    done: false,
                    value: event
                };
            }
        }

        return {
            done: true,
            value: undefined as unknown as TrackedDomainEventMessage
        };
    }

    public async return(): Promise<IteratorResult<TrackedDomainEventMessage>> {
        return {
            done: true,
            value: undefined as unknown as TrackedDomainEventMessage
        };
    }

    public close(): void {
        this.closed = true;
    }

}
