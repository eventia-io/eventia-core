import { DomainEventMessage } from "./DomainEventMessage";
import { TrackingToken } from "./TrackingToken";
import { ExcludeMethods } from "../Infrastructure/ExcludeMethods";


export class TrackedDomainEventMessage<T = any> extends DomainEventMessage<T> {

    public readonly trackingToken: TrackingToken;

    public constructor(values: ExcludeMethods<TrackedDomainEventMessage>) {
        super(values);
    }

}
