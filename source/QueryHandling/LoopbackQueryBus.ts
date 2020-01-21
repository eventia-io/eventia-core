import { AbstractQueryBus } from "./AbstractQueryBus";
import { QueryMessageHandler } from "./QueryBus";
import { QueryMessage } from "./QueryMessage";
import { Query } from "./Query";


export class LoopbackQueryBus extends AbstractQueryBus {

    protected readonly handlerMap = new Map<string, QueryMessageHandler>();

    public subscribe(queryName: string, handler: QueryMessageHandler): void {
        this.handlerMap.set(queryName, handler);
    }

    public async dispatch<T extends Query<any, any>>(query: T, metadata?: any): Promise<T["__QUERY_RETURN_TYPE"]>;
    public async dispatch(query: any, metadata?: any): Promise<void>;
    public async dispatch(query: QueryMessage | any, metadata?: any): Promise<any> {
        const queryMessage = query instanceof QueryMessage
            ? query
            : QueryMessage.fromInstance(query, metadata);

        const queryName = queryMessage.payloadType;
        const handler = this.handlerMap.get(queryName) as QueryMessageHandler;

        if (handler === undefined) {
            throw new Error(`No handlers registered for query "${queryName}"`);
        }

        return handler(queryMessage);
    }

}
