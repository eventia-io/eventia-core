import { ExcludeMethods } from "../Infrastructure/ExcludeMethods";
import { EventMessage } from "./EventMessage";


export class DomainEventMessage<T = any> extends EventMessage<T> {

    public readonly aggregateIdentifier: string;
    public readonly aggregateType: string;
    public readonly sequenceNumber: number;

    public constructor(values: ExcludeMethods<DomainEventMessage<T>>) {
        super(values);
    }

}
