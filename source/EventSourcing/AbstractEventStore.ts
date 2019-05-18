import { EventStore } from "./EventStore";
import { Logger } from "../Infrastructure/Logger";
import { EventStorageEngine } from "./EventStorageEngine";
import { MessageInterceptor } from "../Messaging/MessageInterceptor";
import { EventMessage } from "../EventHandling/EventMessage";
import { PositionalTrackingToken, LowerBoundTrackingToken } from "../EventHandling/PositionalTrackingToken";
import { FiniteStream } from "../Infrastructure/FiniteStream";
import { DomainEventMessage } from "../EventHandling/DomainEventMessage";
import { AggregateIdentifierTrackingToken } from "../EventHandling/AggregateIdentifierTrackingToken";
import { PublishResult } from "../EventHandling/EventBus";
import { TrackingToken } from "../EventHandling/TrackingToken";
import { InfiniteStream } from "../Infrastructure/InfiniteStream";


export abstract class AbstractEventStore implements EventStore {

    protected readonly logger: Logger;
    protected readonly eventStorageEngine: EventStorageEngine;
    protected readonly dispatchInterceptors: MessageInterceptor<EventMessage>[] = [];
    protected readonly dispatchQueue: EventMessage[] = [];

    protected lastTrackedToken: PositionalTrackingToken;

    public constructor(logger: Logger, eventStorageEngine: EventStorageEngine) {
        this.logger = logger;
        this.eventStorageEngine = eventStorageEngine;
    }

    public registerDispatchInterceptor(interceptor: MessageInterceptor<EventMessage>): void {
        this.dispatchInterceptors.push(interceptor);
    }

    public async * readEvents(
        aggregateIdentifier: string,
        firstSequenceNumber?: number
    ): FiniteStream<DomainEventMessage> {
        const trackingToken = new AggregateIdentifierTrackingToken(aggregateIdentifier);
        const eventStream = this.eventStorageEngine.readEvents(trackingToken);

        for await (const event of eventStream) {
            if (firstSequenceNumber === undefined || event.sequenceNumber >= firstSequenceNumber) {
                yield event;
            }
        }
    }

    public async publish(eventOrEvents: EventMessage | EventMessage[]): Promise<PublishResult> {
        const events = Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents];

        const domainEvents: DomainEventMessage[] = [];

        for (const event of events) {
            if (event instanceof DomainEventMessage) {
                domainEvents.push(event);
            }
        }

        if (domainEvents.length > 0) {
            await this.eventStorageEngine.appendEvents(domainEvents);
        }


        return {
            eventsPublished: domainEvents.length
        };
    }

    public async createHeadToken(): Promise<TrackingToken> {
        return this.eventStorageEngine.createHeadToken();
    }

    public async createTailToken(): Promise<TrackingToken> {
        if (this.lastTrackedToken === undefined) {
            this.lastTrackedToken = new PositionalTrackingToken(
                await this.eventStorageEngine.createTailToken()
            );
        }
        return new LowerBoundTrackingToken(this.lastTrackedToken);
    }

    public async createTokenAt(at: Date): Promise<TrackingToken> {
        return this.eventStorageEngine.createTokenAt(at);
    }

    public async createTokenSince(duration: number): Promise<TrackingToken> {
        return this.eventStorageEngine.createTokenSince(duration);
    }

    protected async dispatch(events: EventMessage[]): Promise<void> {
        for (const event of events) {
            const interceptedEvent = await this.applyDispatchInterceptors(event);

            if (interceptedEvent !== undefined && event instanceof DomainEventMessage === false) {
                this.dispatchQueue.push(interceptedEvent);
            }
        }
    }

    protected async applyDispatchInterceptors(event: EventMessage): Promise<EventMessage | undefined> {
        let currentEvent = event;

        for (const interceptor of this.dispatchInterceptors) {
            currentEvent = await interceptor.handle(currentEvent);
            if (currentEvent === undefined) {
                break;
            }
        }

        return currentEvent;
    }

    public abstract openStream(trackingToken?: TrackingToken): InfiniteStream<EventMessage>;

}
