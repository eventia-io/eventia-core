import { AbstractEventProcessor, PayloadHandlerFunction } from "./AbstractEventProcessor";
import { EventMessage } from "./EventMessage";
import { InfiniteStream } from "../Infrastructure/InfiniteStream";
import { TokenStore } from "./TokenStore";
import { Logger } from "../Infrastructure/Logger";
import { StreamableMessageSource } from "../Messaging/StreamableMessageSource";
import { TrackedDomainEventMessage } from "./TrackedDomainEventMessage";


export class TrackingEventProcessor extends AbstractEventProcessor {

    protected tokenStore: TokenStore;

    public constructor(
        logger: Logger,
        messageSource: StreamableMessageSource,
        tokenStore: TokenStore
    ) {
        super(logger, messageSource);

        this.tokenStore = tokenStore;
    }

    protected async openStream(): Promise<InfiniteStream<EventMessage>> {
        return this.messageSource.openStream(
            await this.tokenStore.retrieveToken(this.getName()) ||
            await this.messageSource.createTailToken()
        );
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

}
