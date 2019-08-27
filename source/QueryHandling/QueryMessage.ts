import { Message } from "../Messaging/Message";
import { ExcludeMethods } from "../Infrastructure/ExcludeMethods";
import { UniqueIdentifierFactory } from "../Infrastructure/UniqueIdentifierFactory";


/**
 * Represents a Message that carries a query as its payload.
 * A QueryMessage carries request for information.
 */
export class QueryMessage<T = any> extends Message<T> {

    public constructor(values: ExcludeMethods<QueryMessage<T>>) {
        super(values);
    }

    public static fromInstance<K extends Record<string, any>>(payload: K, metadata?: any): QueryMessage<K> {
        return new QueryMessage<any>({
            identifier: UniqueIdentifierFactory.create(),
            payloadType: payload.constructor.name,
            payload: payload,
            metadata: metadata
        });
    }

}
