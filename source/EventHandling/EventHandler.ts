import { CodeMetadata } from "../Infrastructure/CodeMetadata";
import { EventFactory } from "../Infrastructure/EventFactory";


export type EventHandlerFunction = (event: any, metadata?: any, message?: any) => Promise<void>;

export function EventHandler<T>(
    classConstructor: {},
    methodName: string,
    params: { value?: EventHandlerFunction }
): void {
    const targetParameters = Reflect.getMetadata("design:paramtypes", classConstructor, methodName);

    if (targetParameters === undefined || targetParameters.length === 0 || params.value === undefined) {
        throw new Error(
            "A function decorated with @EventHandler needs at least " +
            "one parameter compatible with the Event interface"
        );
    }

    const className = classConstructor.constructor.name;
    const fullMethodName = `${className}.${methodName}`;

    // The method that handles the event must be async
    if (params.value.constructor.name !== "AsyncFunction") {
        const errorMessage =
            `@EventHandler needs function "${fullMethodName}" to be ASYNC`;

        throw new Error(errorMessage);
    }

    // First parameters is an event
    const eventClassConstructor = targetParameters[0];
    const eventClassName = eventClassConstructor.name;
    EventFactory.register(eventClassName, eventClassConstructor);

    // TODO: register eventclassconstructor in a factory

    // Add to list of handled events
    const handlers = CodeMetadata.getProperty<string[]>(
        className,
        "EventHandlers",
        []
    );

    handlers.push(eventClassName);

    CodeMetadata.setProperty<string[]>(
        className,
        "EventHandlers",
        handlers
    );

    // Register as an EventHandler
    CodeMetadata.setProperty<EventHandlerFunction>(
        eventClassName,
        `EventHandlerFunction.${className}`,
        params.value
    );

    CodeMetadata.setProperty(
        eventClassName,
        `EventHandlerFunctionFullMethodName.${className}`,
        fullMethodName
    );
}
