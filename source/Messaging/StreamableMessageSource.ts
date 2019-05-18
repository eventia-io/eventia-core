import { TrackingToken } from "../EventHandling/TrackingToken";
import { EventMessage } from "../EventHandling/EventMessage";
import { InfiniteStream } from "../Infrastructure/InfiniteStream";


export interface StreamableMessageSource {
    createHeadToken(): Promise<TrackingToken>;
    createTailToken(): Promise<TrackingToken>;
    createTokenAt(at: Date): Promise<TrackingToken>;
    createTokenSince(duration: number): Promise<TrackingToken>;

    openStream(trackingToken?: TrackingToken): InfiniteStream<EventMessage>;
}
