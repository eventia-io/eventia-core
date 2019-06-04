import { CodeMetadata } from "../Infrastructure/CodeMetadata";
import { EventFactory } from "../Infrastructure/EventFactory";

/**
 * Tags a class as a domain event.
 * A domain event represents a state change in an event sourced aggregate and are
 * "applied" (using the apply method in the aggregate lifecycle) after processing
 * a command in the aggregate.
 */
export function DomainEvent<T>(
    constructor: new (...args: any[]) => T
): void {
    CodeMetadata.setProperty(constructor.name, "DomainEvent", true);
    EventFactory.register(constructor.name, constructor);
}
