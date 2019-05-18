import { Repository } from "../DomainDrivenDesign/Repository";
import { Logger } from "../Infrastructure/Logger";
import { RepositoryFactory } from "../Infrastructure/RepositoryFactory";


export type AggregateConstructor<T> = new (...args: any[]) => T;

export abstract class AbstractRepository<T> implements Repository<T> {

    protected readonly logger: Logger;
    protected readonly aggregateConstructor: AggregateConstructor<T>;

    public constructor(logger: Logger, aggregateType: AggregateConstructor<T>) {
        this.logger = logger;
        this.aggregateConstructor = aggregateType;

        RepositoryFactory.register(this.aggregateConstructor.name, this);
    }

    public createInstance(...args: any[]): T {
        const constructor = this.aggregateConstructor;
        return new constructor(...args);
    }

    public abstract load(aggregateIdentifier: string): Promise<T>;
    public abstract save(aggregateInstance: T): Promise<void>;

}
