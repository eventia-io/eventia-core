import { AbstractQueryBus } from "./AbstractQueryBus";
import { QueryMessageHandler } from "./QueryBus";
import { QueryMessage } from "./QueryMessage";
import { QueryResponse } from "./QueryHandler";
import { Query } from "./Query";


export class LoopbackQueryBus extends AbstractQueryBus {

    protected readonly handlerMap = new Map<string, QueryMessageHandler>();

    public subscribe(queryName: string, handler: QueryMessageHandler): void {
        this.handlerMap.set(queryName, handler);
    }

    public async dispatch<T extends Query<T>>(query: T, metadata?: any): QueryResponse<T["__QUERY_RETURN_TYPE"]>;
    public async dispatch<T = {}>(query: QueryMessage | any, metadata?: any): QueryResponse<T> {
        const queryMessage = query instanceof QueryMessage
            ? query
            : QueryMessage.fromInstance(query, metadata);

        const queryName = queryMessage.payloadType;
        const handler = this.handlerMap.get(queryName) as QueryMessageHandler<T>;

        if (handler === undefined) {
            throw new Error(`No handlers registered for query "${queryName}"`);
        }

        return handler(queryMessage);
    }

}
