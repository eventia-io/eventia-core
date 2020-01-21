import { QueryResponse, QueryHandlerFunction } from "./QueryHandler";
import { QueryBus, QueryMessageHandler } from "./QueryBus";
import { Logger } from "../Infrastructure/Logger";
import { CodeMetadata } from "../Infrastructure/CodeMetadata";
import { QueryMessage } from "./QueryMessage";
import { Query } from "./Query";


export abstract class AbstractQueryBus implements QueryBus {

    protected logger: Logger;

    public constructor(logger: Logger) {
        this.logger = logger;
    }

    public register(instance: {}): void {
        const className = instance.constructor.name;

        const handledQueries = CodeMetadata.getProperty<string[]>(className, "HandledQueries", []);
        for (const queryName of handledQueries) {
            const handler = CodeMetadata.getProperty<QueryHandlerFunction>(queryName, "QueryHandlerFunction");
            if (handler !== undefined) {
                this.subscribe(
                    queryName,
                    (queryMessage): Promise<QueryResponse> => handler.call(
                        instance,
                        queryMessage.payload,
                        queryMessage.metadata
                    )
                );
            }
        }
    }

    public abstract subscribe(queryName: string, handler: QueryMessageHandler): void;

    public abstract dispatch(queryMessage: QueryMessage): Promise<any>;
    public abstract dispatch<T extends Query<any, any>>(query: T, metadata?: any): Promise<T["__QUERY_RETURN_TYPE"]>;
    public abstract dispatch(query: any, metadata?: any): Promise<any>;

}
