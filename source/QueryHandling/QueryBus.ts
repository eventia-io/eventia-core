import { QueryMessage } from "./QueryMessage";
import { QueryResponse } from "./QueryHandler";
import { Query } from "./Query";


export type QueryMessageHandler<T = any> = (commandMessage: QueryMessage) => QueryResponse<T>;

export interface QueryBus {

    subscribe(queryName: string, handler: QueryMessageHandler): void;

    dispatch(queryMessage: QueryMessage): Promise<any>;
    dispatch<T extends Query<any, any>>(query: T, metadata?: any): Promise<T["__QUERY_RETURN_TYPE"]>;
    dispatch(query: any, metadata?: any): Promise<any>;

}
