import { Message } from "../Messaging/Message";
import { ExcludeMethods } from "../Infrastructure/ExcludeMethods";
import { UniqueIdentifierFactory } from "../Infrastructure/UniqueIdentifierFactory";
import { CodeMetadata } from "../Infrastructure/CodeMetadata";


/**
 * Represents a Message that carries a command as its payload.
 * A CommandMessage carries an intention to change application state.
 */
export class CommandMessage<T = any> extends Message<T> {

    public constructor(values: ExcludeMethods<CommandMessage<T>>) {
        super(values);
    }

    public static fromInstance<K extends Record<string, any>>(payload: K, metadata?: any): CommandMessage<K> {
        return new CommandMessage<any>({
            identifier: UniqueIdentifierFactory.create(),
            payloadType: payload.constructor.name,
            payload: payload,
            metadata: metadata
        });
    }

    public getTargetAggregateIdentifier(): string {
        const propertyName = CodeMetadata.getProperty<string>(
            this.payloadType,
            "TargetAggregateIdentifier"
        );

        if (propertyName === undefined) {
            throw new Error(`Command "${this.payload}" doesn't have a @TargetAggregateIdentifier property`);
        }

        return this.payload[propertyName];
    }

}
