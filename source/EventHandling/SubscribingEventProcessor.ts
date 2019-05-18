import { AbstractEventProcessor } from "./AbstractEventProcessor";
import { EventMessage } from "./EventMessage";
import { InfiniteStream } from "../Infrastructure/InfiniteStream";


export class SubscribingEventProcessor extends AbstractEventProcessor {

    protected async openStream(): Promise<InfiniteStream<EventMessage>> {
        return this.messageSource.openStream();
    }

}
