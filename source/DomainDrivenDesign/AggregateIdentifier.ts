import { CodeMetadata } from "../Infrastructure/CodeMetadata";


/**
 * Property decorator that sets the class property as the aggregate identifier.
 */
export function AggregateIdentifier(
    classPrototype: any,
    propertyName: string
): void {
    const className = classPrototype.constructor.name;

    // Make sure we don't apply this decorator on an command by error
    if (CodeMetadata.getProperty<boolean>(className, "Command", false) === true) {
        const message = `Cannot use @AggregateIdentifier on class "${className}" ` +
            "because it's already tagged as an command";

        throw new Error(message);
    }


    CodeMetadata.setProperty(className, "Aggregate", true);
    CodeMetadata.setProperty(className, "AggregateIdentifier", propertyName);
}
