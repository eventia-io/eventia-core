import { EventMessage } from "../EventHandling/EventMessage";
import { TrackingToken } from "../EventHandling/TrackingToken";
import { InfiniteStream } from "../Infrastructure/InfiniteStream";
import { AnyMessageTrackingToken } from "../EventHandling/AnyMessageTrackingToken";
import { CombinedTrackingToken } from "../EventHandling/CombinedTrackingToken";
import {
    PositionalTrackingToken, LowerBoundTrackingToken, UpperBoundTrackingToken
} from "../EventHandling/PositionalTrackingToken";
import { AbstractEventStore } from "./AbstractEventStore";
import { EventMessageTrackingSubscribableStream } from "./EventMessageTrackingSubscribableStream";
import { Logger } from "../Infrastructure/Logger";
import { EventStorageEngine } from "./EventStorageEngine";


const defaultPullTimeout = 100;
const defaultStreamCapacity = 500;

export interface PullingEventStoreOptions {
    pullTimeout?: number;
    streamCapacity?: number;
}

export class PullingEventStore extends AbstractEventStore {

    protected readonly pullTimeout: number;
    protected readonly streamCapacity: number;

    protected newStreams: EventMessageTrackingSubscribableStream[] = [];
    protected closedStreams: EventMessageTrackingSubscribableStream[] = [];

    protected pullingLoopActive = false;

    public constructor(logger: Logger, storageEngine: EventStorageEngine, options?: PullingEventStoreOptions) {
        super(logger, storageEngine);

        this.pullTimeout = (options && options.pullTimeout) ? options.pullTimeout : defaultPullTimeout;
        this.streamCapacity = (options && options.streamCapacity) ? options.streamCapacity : defaultStreamCapacity;
    }

    public openStream(trackingToken?: TrackingToken): InfiniteStream<EventMessage> {
        const stream = new EventMessageTrackingSubscribableStream(
            this.logger,
            this.streamCapacity,
            trackingToken || new AnyMessageTrackingToken()
        );

        stream.on("close", () => {
            this.closeStream(stream);
        });

        this.newStreams.push(stream);

        if (this.pullingLoopActive === false) {
            this.pullingLoopActive = true;
            this.schedulePullingLoop();
        }

        return stream;
    }

    protected closeStream(stream: EventMessageTrackingSubscribableStream): void {
        this.closedStreams.push(stream);
    }

    protected schedulePullingLoop(): void {
        setTimeout(
            (): Promise<void> => this.pullingLoop(),
            this.pullTimeout
        );
    }

    protected async pullingLoop(): Promise<void> {
        const lowerBound = await this.createTailToken();
        const upperBound = new UpperBoundTrackingToken(lowerBound);

        if (this.newStreams.length > 0) {
            const newStreams = this.newStreams;
            this.newStreams = [];

            await this.catchupLoop(newStreams, upperBound);
        }

        const events = this.eventStorageEngine.readEvents(
            new LowerBoundTrackingToken(lowerBound)
        );

        for await (const event of events) {
            await this.dispatch([event]);

            this.lastTrackedToken = event.trackingToken as PositionalTrackingToken;
        }

        if (this.closedStreams.length > 0) {
            for (const stream of this.closedStreams) {
                this.streams.delete(stream);
            }

            this.closedStreams = [];
        }

        this.schedulePullingLoop();
    }

    protected async catchupLoop(
        newStreams: EventMessageTrackingSubscribableStream[],
        upperBound: TrackingToken
    ): Promise<void> {
        const catchupStreams = this.filterCatchupStreams(newStreams);
        if (catchupStreams.length > 0) {
            // Create a single tracking token that matches all events required by the catchup streams
            const combinedTrackingToken = new CombinedTrackingToken([
                ...catchupStreams.map((stream) => stream.trackingToken),
                upperBound
            ]);

            // Feed initial events to the streams
            for await (const event of this.eventStorageEngine.readEvents(combinedTrackingToken)) {
                const promises = catchupStreams.map((stream) => stream.publish(event));
                await Promise.all(promises);
            }
        }

        // At this point all new streams are up-to-date
        for (const stream of newStreams) {
            stream.emit("ready");
            this.streams.add(stream);
        }
    }

    protected delay(duration: number): Promise<void> {
        return new Promise<void>((resolve): void => {
            setTimeout((): void => resolve(), duration);
        });
    }

    protected filterCatchupStreams(
        streams: EventMessageTrackingSubscribableStream[]
    ): EventMessageTrackingSubscribableStream[] {
        return streams
            .filter(
                (stream): boolean => stream.trackingToken.needsCatchup()
            );
    }

}
