import { ExcludeMethods } from "../Infrastructure/ExcludeMethods";


export class Message<T = any> {

    public readonly identifier: string;
    public readonly payloadType: string;
    public readonly payload: T;
    public readonly metadata: any;

    public constructor(values: ExcludeMethods<Message<T>>) {
        Object.assign(this, values);
    }

    public cloneWithMetadata(metadata: any): this {
        const cloned = Object.assign({}, this, { metadata });

        const clonedMessage = new (this.constructor as any)(cloned);
        return clonedMessage;
    }

    public cloneAndMergeMetadata(metadata: any): this {
        const clonedMetadata = (this.metadata === undefined)
            ? metadata
            : Object.assign(this.metadata, metadata);

        const cloned = Object.assign({}, this, { metadata: clonedMetadata });

        const clonedMessage = new (this.constructor as any)(cloned);
        return clonedMessage;
    }

}
