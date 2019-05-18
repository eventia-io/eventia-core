import { EventMessage } from "../EventHandling/EventMessage";
import { SubscribableStream } from "../Infrastructure/SubscribableStream";
import { TrackingToken } from "../EventHandling/TrackingToken";
import { Logger } from "../Infrastructure/Logger";


export class TrackingSubscribableStream<T extends EventMessage> extends SubscribableStream<T> {

    public readonly trackingToken: TrackingToken;

    public constructor(logger: Logger, capacity: number, trackingToken: TrackingToken) {
        super(logger, capacity);

        this.trackingToken = trackingToken;
    }

    public publish(value: T): Promise<void> {
        if (this.trackingToken.covers(value)) {
            return super.publish(value);
        }

        return Promise.resolve();
    }

}

export class EventMessageTrackingSubscribableStream extends TrackingSubscribableStream<EventMessage> {
}
