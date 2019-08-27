import { Message } from "../Messaging/Message";
import { ExcludeMethods } from "../Infrastructure/ExcludeMethods";
import { UniqueIdentifierFactory } from "../Infrastructure/UniqueIdentifierFactory";


export class EventMessage<T = any> extends Message<T> {

    public readonly timestamp: Date;

    public constructor(values: ExcludeMethods<EventMessage<T>>) {
        super(values);
    }

    public static fromInstance<K extends Record<string, any>>(payload: K, metadata?: any): EventMessage<K> {
        return new EventMessage<any>({
            identifier: UniqueIdentifierFactory.create(),
            timestamp: new Date(),
            payloadType: payload.constructor.name,
            payload: payload,
            metadata: metadata
        });
    }

}
