import { CodeMetadata } from "../Infrastructure/CodeMetadata";


/**
 * Property decorator that sets the class property as the aggregate identifier.
 */
export function TargetAggregateIdentifier(
    classPrototype: any,
    propertyName: string
): void {
    const className = classPrototype.constructor.name;

    // Make sure we don't apply this decorator on an aggregate by error
    if (CodeMetadata.getProperty<boolean>(className, "Aggregate", false) === true) {
        const message = `Cannot use @TargetAggregateIdentifier on class "${className}" ` +
            "because it's already tagged as an aggregate";

        throw new Error(message);
    }

    CodeMetadata.setProperty(className, "Command", true);
    CodeMetadata.setProperty(className, "TargetAggregateIdentifier", propertyName);
}
