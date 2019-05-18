import { Aggregate } from "../DomainDrivenDesign/Aggregate";
import { EventMessage } from "../EventHandling/EventMessage";
import { DomainEventMessage } from "../EventHandling/DomainEventMessage";
import { CodeMetadata } from "../Infrastructure/CodeMetadata";
import { EventSourcingHandlerFunction } from "./EventSourcingHandler";
import { UniqueIdentifierFactory } from "../Infrastructure/UniqueIdentifierFactory";


export class EventSourcedAggregate<T = any> extends Aggregate<T> {

    protected uncommitedEvents: EventMessage[] = [];

    public constructor(model: T, initialEvents?: Iterable<DomainEventMessage>) {
        super(model);

        if (initialEvents !== undefined) {
            for (const event of initialEvents) {
                this.apply(false, event.payloadType, event.payload, event.metadata);
            }
        }
    }

    public hasUncommitedEvents(): boolean {
        return this.uncommitedEvents.length > 0;
    }

    public getUncommitedEvents(): EventMessage[] {
        return this.uncommitedEvents;
    }

    public clearUncommitedEvents(): void {
        this.uncommitedEvents = [];
    }

    public apply(publish: boolean, eventClassName: string, payload: any, metadata?: any): void {
        const dispatcherFunction = CodeMetadata.getProperty<EventSourcingHandlerFunction>(
            eventClassName,
            "EventSourcingHandlerFunction"
        );

        if (dispatcherFunction === undefined) {
            throw new Error(`No EventSourcingHandler registered for domain event ${eventClassName}`);
        }

        dispatcherFunction.call(this.model, payload, metadata);

        this.version++;

        if (publish) {
            // TODO : Generate UUID
            this.uncommitedEvents.push(new DomainEventMessage({
                identifier: UniqueIdentifierFactory.create(),
                aggregateIdentifier: this.getIdentifier(),
                aggregateType: this.getType(),
                sequenceNumber: this.version,
                payloadType: eventClassName,
                payload: payload,
                metadata: metadata,
                timestamp: new Date()
            }));
        }
    }

}
