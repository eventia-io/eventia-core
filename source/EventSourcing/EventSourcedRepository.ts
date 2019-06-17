import { Logger } from "../Infrastructure/Logger";
import { EventStore } from "./EventStore";
import { initializeEventSourcedAggregate, getEventSourcedAggregate } from "../DomainDrivenDesign/AggregateLifecycle";
import { AbstractRepository, AggregateConstructor } from "./AbstractRepository";


export class EventSourcedRepository<T> extends AbstractRepository<T> {

    protected readonly eventStore: EventStore;

    public constructor(logger: Logger, eventStore: EventStore, aggregateConstructor: AggregateConstructor<T>) {
        super(logger, aggregateConstructor);

        this.eventStore = eventStore;
    }

    public async load(aggregateIdentifier: string): Promise<T | undefined> {
        // Read all domain events in the event store
        const eventMessages = await this.eventStore.readEvents(aggregateIdentifier);

        // Create a new instance of the aggregate and its helper class
        const state = this.createInstance();
        const aggregateRoot = getEventSourcedAggregate(state, false);

        // Apply state
        for await (const eventMessage of eventMessages) {
            aggregateRoot.apply(false, eventMessage.payloadType, eventMessage.payload, eventMessage.metadata);
        }

        // If no events have been processed, the aggregate doesn't exist
        if (aggregateRoot.getVersion() === 0) {
            return undefined;
        }

        return state;
    }

    public async save(aggregateInstance: T): Promise<void> {
        const aggregateRoot = getEventSourcedAggregate(aggregateInstance, false);
        if (aggregateRoot.hasUncommitedEvents) {
            await this.eventStore.publish(aggregateRoot.getUncommitedEvents());
            aggregateRoot.clearUncommitedEvents();
        }
    }

    public createInstance(...args: any[]): T {
        const state = super.createInstance(...args);
        initializeEventSourcedAggregate(state);

        return state;
    }

}
