import { TrackingToken } from "./TrackingToken";
import { EventMessage } from "./EventMessage";
import { DomainEventMessage } from "./DomainEventMessage";


/**
 * A tracking token that denotes a filter based on the aggregate identifier.
 */
export class AggregateIdentifierTrackingToken extends TrackingToken {

    public readonly identifier: string;

    public constructor(identifier: string) {
        super();
        this.identifier = identifier;
    }

    public covers(eventMessage: EventMessage): boolean {
        if (eventMessage instanceof DomainEventMessage) {
            return eventMessage.aggregateIdentifier === this.identifier;
        }

        throw new Error("Unsupported TrackingToken covering check operation");
    }

    public needsCatchup(): boolean {
        return false;
    }

}
