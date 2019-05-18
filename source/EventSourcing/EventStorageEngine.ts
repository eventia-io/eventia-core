import { TrackingToken } from "../EventHandling/TrackingToken";
import { InfiniteStream } from "../Infrastructure/InfiniteStream";
import { TrackedDomainEventMessage } from "../EventHandling/TrackedDomainEventMessage";
import { DomainEventMessage } from "../EventHandling/DomainEventMessage";


export interface EventStorageEngine {

    readEvents(trackingToken: TrackingToken, block?: boolean): InfiniteStream<TrackedDomainEventMessage>;
    appendEvents(eventOrEvents: DomainEventMessage | DomainEventMessage[]): Promise<void>;

    createHeadToken(): Promise<TrackingToken>;
    createTailToken(): Promise<TrackingToken>;
    createTokenAt(at: Date): Promise<TrackingToken>;
    createTokenSince(duration: number): Promise<TrackingToken>;

}
