import { CodeMetadata } from "../Infrastructure/CodeMetadata";


export type QueryResponse<T = {}> = Promise<T>;
export type QueryHandlerFunction = (query: any, metadata?: any) => QueryResponse;


function checkAsyncFunction(classMethod: any, fullMethodName: string): void {
    // The method that handles the event must be async
    if (classMethod.constructor.name !== "AsyncFunction") {
        const errorMessage =
            `@QueryHandler needs function "${fullMethodName}" to be ASYNC`;

        throw new Error(errorMessage);
    }
}

function addQueryHandler(
    targetClassName: string,
    targetMethodName: string,
    targetFunction: QueryHandlerFunction,
    queryClassName: string
): void {
    const fullMethodName = `${targetClassName}.${targetMethodName}`;

    // Register as an external command handler
    CodeMetadata.setProperty<QueryHandlerFunction>(
        queryClassName,
        "QueryHandlerFunction",
        targetFunction
    );

    CodeMetadata.setProperty(
        queryClassName,
        "QueryHandlerFunctionFullMethodName",
        fullMethodName
    );
}


function checkQueryNotBeingPreviouslyHandled(
    targetClassName: string,
    targetMethodName: string,
    queryClassName: string
): void {
    const handlingFunction = CodeMetadata.getProperty<QueryHandlerFunction>(queryClassName, "QueryHandlerFunction");

    if (handlingFunction !== undefined) {
        const fullMethodName = `${targetClassName}.${targetMethodName}`;

        const previousFullMethodName = CodeMetadata.getProperty<string>(
            queryClassName,
            "QueryHandlerFunctionFullMethodName"
        );

        const errorMessage =
            `The query "${queryClassName}" is already assigned to class "${previousFullMethodName}" ` +
            `as a QueryHandler. It can't be assigned to "${fullMethodName}".`;

        throw new Error(errorMessage);
    }
}

export function QueryHandler<T>(
    classConstructor: {},
    methodName: string,
    params: { value?: QueryHandlerFunction }
): void {
    const targetParameters = Reflect.getMetadata("design:paramtypes", classConstructor, methodName);

    if (targetParameters === undefined || targetParameters.length === 0 || params.value === undefined) {
        throw new Error(
            "A function decorated with @QueryHandler needs at least one parameter."
        );
    }

    const className = classConstructor.constructor.name;
    const fullMethodName = `${className}.${methodName}`;
    const queryClassName = targetParameters[0].name;

    // Handling function must be async
    checkAsyncFunction(params.value, fullMethodName);
    checkQueryNotBeingPreviouslyHandled(className, methodName, queryClassName);
    addQueryHandler(className, methodName, params.value, queryClassName);

    // Save a reference in the handling class
    const handledCommands = CodeMetadata.getProperty<string[]>(
        className,
        "HandledQueries",
        []
    );

    handledCommands.push(queryClassName);

    CodeMetadata.setProperty(
        className,
        "HandledQueries",
        handledCommands
    );
}
