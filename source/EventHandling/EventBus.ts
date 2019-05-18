import { EventMessage } from "./EventMessage";


export interface PublishResult {
    readonly eventsPublished: number;
}

export interface EventBus {
    publish(eventOrEvents: EventMessage | EventMessage[]): Promise<PublishResult>;
}
