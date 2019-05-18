import { EventSourcedAggregate } from "../EventSourcing/EventSourcedAggregate";
import { DomainEventMessage } from "../EventHandling/DomainEventMessage";


const stateProxyKey = "__root";

export function apply(model: any, event: any, metadata?: any): void {
    const aggregateRoot = getEventSourcedAggregate(model, true);

    const eventClassName = event.constructor.name;
    aggregateRoot.apply(true, eventClassName, event, metadata);
}

export function initializeEventSourcedAggregate<T = any>(
    model: T,
    initialEvents?: Iterable<DomainEventMessage>
): EventSourcedAggregate<T> {
    if (model[stateProxyKey] !== undefined) {
        return model[stateProxyKey];
    }

    const aggregateRoot = new EventSourcedAggregate(model, initialEvents);
    model[stateProxyKey] = aggregateRoot;

    return aggregateRoot;
}

export function getEventSourcedAggregate(
    model: any,
    initializeIfNecessary: boolean
): EventSourcedAggregate {
    let aggregate = model[stateProxyKey] as EventSourcedAggregate;

    if (aggregate === undefined && initializeIfNecessary === false) {
        throw new Error(`Class ${model.constructor.name} is not an event sourced aggregate`);
    } else if (aggregate === undefined && initializeIfNecessary === true) {
        aggregate = initializeEventSourcedAggregate(model);
    }

    return aggregate;
}
