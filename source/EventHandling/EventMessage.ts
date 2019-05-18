import { Message } from "../Messaging/Message";
import { ExcludeMethods } from "../Infrastructure/ExcludeMethods";


export class EventMessage<T = any> extends Message<T> {

    public readonly timestamp: Date;

    public constructor(values: ExcludeMethods<EventMessage<T>>) {
        super(values);
    }

}
