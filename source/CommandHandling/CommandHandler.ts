import { CodeMetadata } from "../Infrastructure/CodeMetadata";


export type CommandHandlerFunction = (command: any, metadata?: any) => Promise<any>;

function isAggregate(className: string): boolean {
    return CodeMetadata.getProperty(className, "Aggregate", false);
}

function setHandlingMethod(
    commandClassName: string,
    handlingMethod: string
): void {
    CodeMetadata.setProperty(commandClassName, "HandlingMethod", handlingMethod);
}

function setAggregateClass(
    commandClassName: string,
    aggregateClass: string
): void {
    CodeMetadata.setProperty(commandClassName, "AggregateClass", aggregateClass);
}

function addCommandToCommandBus(commandClassName: string): void {
    // The CommandBus implementation should create code to handle this command
    const aggregateHandledCommands = CodeMetadata.getProperty<string[]>(
        "CommandBus",
        "AggregateHandledCommands",
        []
    );
    aggregateHandledCommands.push(commandClassName);
    CodeMetadata.setProperty("CommandBus", "AggregateHandledCommands", aggregateHandledCommands);
}

function checkCommandHasTargetAggregateIdentifier(
    commandClassName: string,
    targetClassName: string,
    targetMethodName: string
): void {
    const targetAggregateIdentifier = CodeMetadata.getProperty<string>(
        commandClassName,
        "TargetAggregateIdentifier"
    );

    if (targetAggregateIdentifier === undefined) {
        const fullMethodName = `${targetClassName}.${targetMethodName}`;

        const message = `Cannot use @CommandHandler on aggregate method "${fullMethodName}" because ` +
            `command "${commandClassName}" doesn't have any property decorated with @TargetAggregateIdentifier`;

        throw new Error(message);
    }
}

function addCommandHandler(
    targetClassName: string,
    targetMethodName: string,
    targetFunction: CommandHandlerFunction,
    commandClassName: string
): void {
    const fullMethodName = `${targetClassName}.${targetMethodName}`;

    // Register as an external command handler
    CodeMetadata.setProperty<CommandHandlerFunction>(
        commandClassName,
        "CommandHandlerFunction",
        targetFunction
    );

    CodeMetadata.setProperty(
        commandClassName,
        "CommandHandlerFunctionFullMethodName",
        fullMethodName
    );
}


function checkCommandNotBeingPreviouslyHandled(
    targetClassName: string,
    targetMethodName: string,
    commandClassName: string
): void {
    const handlingMethod = CodeMetadata.getProperty<string>(commandClassName, "HandlingMethod");

    if (handlingMethod !== undefined) {
        if (handlingMethod === "AggregateConstructor" || handlingMethod === "AggregateInstance") {
            const errorMessage = `"${commandClassName}" already assigned to be handled inside an aggregate`;
            throw new Error(errorMessage);
        }

        const fullMethodName = `${targetClassName}.${targetMethodName}`;

        const previousFullMethodName = CodeMetadata.getProperty<string>(
            commandClassName,
            "CommandHandlerFunctionFullMethodName"
        );

        const errorMessage =
            `The command "${commandClassName}" is already assigned to class "${previousFullMethodName}" ` +
            `as an CommandHandler. It can't be assigned to "${fullMethodName}".`;

        throw new Error(errorMessage);
    }
}

function methodCommandHandler<T>(
    classConstructor: {},
    methodName: string,
    params: { value?: CommandHandlerFunction }
): void {
    const targetParameters = Reflect.getMetadata("design:paramtypes", classConstructor, methodName);

    if (targetParameters === undefined || targetParameters.length === 0 || params.value === undefined) {
        throw new Error(
            "A function decorated with @CommandHandler needs at least one parameter."
        );
    }

    const className = classConstructor.constructor.name;

    // First parameters MUST be something registered as a DomainEvent
    const commandClassName = targetParameters[0].name;
    // TODO
    // if (CodeMetadata.getProperty(eventClassName, "DomainEvent", false) === false) {
    //     const errorMessage =
    //         `The type "${eventClassName}" of the first parameter of "${fullMethodName}" ` +
    //         "is not registered as a @DomainEvent";

    //     throw new Error(errorMessage);
    // }

    checkCommandNotBeingPreviouslyHandled(className, methodName, commandClassName);

    if (isAggregate(className)) {
        checkCommandHasTargetAggregateIdentifier(commandClassName, className, methodName);
        setHandlingMethod(commandClassName, "AggregateInstance");
        setAggregateClass(commandClassName, className);
        addCommandToCommandBus(commandClassName);
    } else {
        setHandlingMethod(commandClassName, "ExternalInstance");
    }

    addCommandHandler(className, methodName, params.value, commandClassName);

    // Save a reference in the handling class
    const handledCommands = CodeMetadata.getProperty<string[]>(
        className,
        "HandledCommands",
        []
    );

    handledCommands.push(commandClassName);

    CodeMetadata.setProperty(
        className,
        "HandledCommands",
        handledCommands
    );
}

type ClassDecorator<T> = (constructor: new (command: any, metadata?: any) => T) => void;

function constructorCommandHandler<T>(commandClass: Function): ClassDecorator<T> {
    const commandClassName = commandClass.name;

    return (classConstructor): void => {
        const classConstructorName = classConstructor.name;

        // This command will be handled directly in the aggregate
        setHandlingMethod(commandClassName, "AggregateConstructor");
        setAggregateClass(commandClassName, classConstructorName);
        addCommandToCommandBus(commandClassName);
    };
}


function CommandHandler<T>(constructor: any, methodName: string, params: { value?: CommandHandlerFunction }): void;
function CommandHandler<T>(commandConstructor: any): ClassDecorator<T>;
function CommandHandler<T>(
    classConstructor: any,
    methodName?: string,
    params?: { value?: CommandHandlerFunction }
): void | ClassDecorator<T> {
    if (methodName !== undefined && params !== undefined) {
        return methodCommandHandler(classConstructor, methodName, params);
    }

    return constructorCommandHandler(classConstructor);
}

export { CommandHandler };
