import { CodeMetadata } from "../Infrastructure/CodeMetadata";


function checkNotAsyncFunction(fn: Function, fullMethodName: string): void {
    // The method that handles the event can't be async
    if (fn.constructor.name === "AsyncFunction") {
        const errorMessage =
            `@EventSourcingHandler cannot be used on ASYNC function "${fullMethodName}"`;

        throw new Error(errorMessage);
    }
}

export type EventSourcingHandlerFunction = (event: any, metadata?: any) => void;

export function EventSourcingHandler<T>(
    classConstructor: {},
    methodName: string,
    params: { value?: EventSourcingHandlerFunction }
): void {
    const targetParameters = Reflect.getMetadata("design:paramtypes", classConstructor, methodName);

    if (targetParameters === undefined || targetParameters.length === 0 || params.value === undefined) {
        throw new Error(
            "A function decorated with @EventSourcingHandler needs at least " +
            "one parameter compatible with the Event interface"
        );
    }

    const className = classConstructor.constructor.name;
    const fullMethodName = `${className}.${methodName}`;

    // The method that handles the event can't be async
    checkNotAsyncFunction(params.value, fullMethodName);

    // The class which will receive the events must be an aggregate
    if (CodeMetadata.getProperty(className, "Aggregate", false) === false) {
        const errorMessage =
            `The class "${className}" must be an aggregate. Consider adding a ` +
            "@AggregateIdentifier to one of its properties.";

        throw new Error(errorMessage);
    }

    // First parameters MUST be something registered as a DomainEvent
    const eventClassName = targetParameters[0].name;
    if (CodeMetadata.getProperty(eventClassName, "DomainEvent", false) === false) {
        const errorMessage =
            `The type "${eventClassName}" of the first parameter of "${fullMethodName}" ` +
            "is not registered as a @DomainEvent";

        throw new Error(errorMessage);
    }

    // Check that the event is not assigned to another class as an EventSourcingHandler
    const handlerFunction = CodeMetadata.getProperty<EventSourcingHandlerFunction>(
        eventClassName,
        "EventSourcingHandlerFunction"
    );

    if (handlerFunction !== undefined) {
        const previousFullMethodName = CodeMetadata.getProperty<string>(
            eventClassName,
            "EventSourcingHandlerFunctionFullMethodName"
        );

        const errorMessage =
            `The event "${eventClassName}" is already assigned to class "${previousFullMethodName}" ` +
            `as an EventSourcingHandler. It can't be assigned to "${fullMethodName}".`;

        throw new Error(errorMessage);
    }

    // Register as an EventSourcingHandler
    CodeMetadata.setProperty<EventSourcingHandlerFunction>(
        eventClassName,
        "EventSourcingHandlerFunction",
        params.value
    );

    CodeMetadata.setProperty(
        eventClassName,
        "EventSourcingHandlerFunctionFullMethodName",
        fullMethodName
    );
}
