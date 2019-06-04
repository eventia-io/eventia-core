import { CodeMetadata } from "../Infrastructure/CodeMetadata";


export class Aggregate<T = any> {

    protected model: T;
    protected version: number;

    public constructor(model: T) {
        this.model = model;
        this.version = 0;
    }

    public getIdentifier(): string {
        // TODO: There must be a decorated field which indicates the aggregate identifier
        const propertyName = CodeMetadata.getProperty<string>(this.getClassName(), "AggregateIdentifier");
        if (propertyName === undefined) {
            const message = `Aggregate ${this.getClassName()} does not have an aggregate identifier property. ` +
                "Consider using the @AggregateIdenfier decorator on a class property.";

            throw new Error(message);
        }

        return this.model[propertyName];
    }

    public getType(): string {
        // TODO: We should be able to override the aggregate type using a decorator
        return this.getClassName();
    }

    public getClassName(): string {
        return this.model.constructor.name;
    }

    public getVersion(): number {
        return this.version;
    }

}
