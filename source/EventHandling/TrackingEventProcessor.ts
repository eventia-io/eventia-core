import { AbstractEventProcessor, PayloadHandlerFunction } from "./AbstractEventProcessor";
import { EventMessage } from "./EventMessage";
import { InfiniteStream } from "../Infrastructure/InfiniteStream";
import { TokenStore } from "./TokenStore";
import { Logger } from "../Infrastructure/Logger";
import { StreamableMessageSource } from "../Messaging/StreamableMessageSource";
import { TrackedDomainEventMessage } from "./TrackedDomainEventMessage";
import { TrackingToken } from "./TrackingToken";
import { CombinedTrackingToken } from "./CombinedTrackingToken";


export class TrackingEventProcessor extends AbstractEventProcessor {

    protected tokenStore: TokenStore;

    public constructor(
        logger: Logger,
        messageSource: StreamableMessageSource,
        tokenStore: TokenStore,
        name?: string
    ) {
        super(logger, messageSource, name);

        this.tokenStore = tokenStore;
    }

    protected async openStream(): Promise<InfiniteStream<EventMessage>> {
        const initialPositionTrackingToken =
            await this.tokenStore.retrieveToken(this.getName()) ||
            await this.getDefaultTrackingToken();

        const trackingToken = new CombinedTrackingToken([
            this.getPayloadTypeTrackingToken(),
            initialPositionTrackingToken
        ]);

        return this.messageSource.openStream(trackingToken);
    }

    protected async invoke(payloadHandlers: PayloadHandlerFunction[], event: EventMessage): Promise<void> {
        await super.invoke(payloadHandlers, event);

        if (event instanceof TrackedDomainEventMessage) {
            await this.tokenStore.storeToken(
                this.getName(),
                event.trackingToken
            );
        }
    }

    protected getDefaultTrackingToken(): Promise<TrackingToken> {
        return this.messageSource.createTailToken();
    }

}
