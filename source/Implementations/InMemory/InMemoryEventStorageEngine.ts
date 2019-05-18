import { EventStorageEngine } from "../../EventSourcing/EventStorageEngine";
import { TrackedDomainEventMessage } from "../../EventHandling/TrackedDomainEventMessage";
import { TrackingToken } from "../../EventHandling/TrackingToken";
import { InfiniteStream } from "../../Infrastructure/InfiniteStream";
import { InMemoryEventStorageQuery } from "./InMemoryEventStorageQuery";
import { DomainEventMessage } from "../../EventHandling/DomainEventMessage";
import { PositionalTrackingToken, LowerBoundTrackingToken } from "../../EventHandling/PositionalTrackingToken";
import { Logger } from "../../Infrastructure/Logger";


export class InMemoryEventStorageEngine implements EventStorageEngine {

    protected readonly logger: Logger;
    protected readonly events: TrackedDomainEventMessage[] = [];

    public constructor(logger: Logger) {
        this.logger = logger;
    }

    public readEvents(trackingToken: TrackingToken, block?: boolean): InfiniteStream<TrackedDomainEventMessage> {
        if (block === true) {
            throw new Error("InMemoryEventStorageEngine does not support infinite streams");
        }

        return new InMemoryEventStorageQuery(this.logger, this.events, trackingToken);
    }

    public async appendEvents(eventOrEvents: DomainEventMessage | DomainEventMessage[]): Promise<void> {
        const events: DomainEventMessage[] = Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents];

        for (const event of events) {
            if (this.checkDuplicate(event)) {
                throw new Error("Duplicate aggregateId + sequenceNumber");
            }
        }

        for (const event of events) {
            this.events.push(new TrackedDomainEventMessage({
                identifier: event.identifier,
                payloadType: event.payloadType,
                payload: event.payload,
                metadata: event.metadata,
                aggregateIdentifier: event.aggregateIdentifier,
                aggregateType: event.aggregateType,
                timestamp: event.timestamp,
                sequenceNumber: event.sequenceNumber,
                trackingToken: new PositionalTrackingToken(this.events.length + 1)
            }));
        }
    }

    public async createHeadToken(): Promise<TrackingToken> {
        return new LowerBoundTrackingToken(0);
    }

    public async createTailToken(): Promise<TrackingToken> {
        return new LowerBoundTrackingToken(this.events.length);
    }

    public async createTokenAt(): Promise<TrackingToken> {
        throw new Error("Not implemented");
    }

    public async createTokenSince(): Promise<TrackingToken> {
        throw new Error("Not implemented");
    }

    public dump(): void {
        this.logger.info(this.events);
    }

    protected checkDuplicate(newEvent: DomainEventMessage): boolean {
        for (const event of this.events) {
            if (event.aggregateIdentifier === newEvent.aggregateIdentifier &&
                event.sequenceNumber === newEvent.sequenceNumber
            ) {
                return true;
            }
        }

        return false;
    }

}
