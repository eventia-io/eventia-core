import { EventBus } from "../EventHandling/EventBus";
import { StreamableMessageSource } from "../Messaging/StreamableMessageSource";
import { FiniteStream } from "../Infrastructure/FiniteStream";
import { DomainEventMessage } from "../EventHandling/DomainEventMessage";


export interface EventStore extends EventBus, StreamableMessageSource {

    readEvents(aggregateIdentifier: string, firstSequenceNumber?: number): FiniteStream<DomainEventMessage>;

}
