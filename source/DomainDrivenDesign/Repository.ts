
export interface Repository<T> {

    load(aggregateIdentifier: string): Promise<T>;
    save(agggregateInstance: T): Promise<void>;
    createInstance(...args: any[]): T;

}
