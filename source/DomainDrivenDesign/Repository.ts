
export interface Repository<T> {

    load(aggregateIdentifier: string): Promise<T | undefined>;
    save(agggregateInstance: T): Promise<void>;
    createInstance(...args: any[]): T;

}
