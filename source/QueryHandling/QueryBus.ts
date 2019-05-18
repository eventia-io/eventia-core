import { QueryMessage } from "./QueryMessage";
import { QueryResponse } from "./QueryHandler";


export type QueryMessageHandler<T = {}> = (commandMessage: QueryMessage) => QueryResponse<T>;

export interface QueryBus {

    subscribe(queryName: string, handler: QueryMessageHandler): void;
    dispatch<T = {}>(queryMessage: QueryMessage): QueryResponse<T>;
    dispatch<T = {}>(query: any, metadata?: any): QueryResponse<T>;

}
