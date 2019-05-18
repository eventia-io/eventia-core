import { QueryResponse, QueryHandlerFunction } from "./QueryHandler";
import { QueryBus, QueryMessageHandler } from "./QueryBus";
import { Logger } from "../Infrastructure/Logger";
import { CodeMetadata } from "../Infrastructure/CodeMetadata";
import { QueryMessage } from "./QueryMessage";


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
    public abstract dispatch<T = {}>(queryMessage: QueryMessage): QueryResponse<T>;
    public abstract dispatch<T = {}>(query: any, metadata?: any): QueryResponse<T>;

}
