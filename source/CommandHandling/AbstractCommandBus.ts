import { CommandBus, CommandMessageHandler } from "./CommandBus";
import { CodeMetadata } from "../Infrastructure/CodeMetadata";
import { CommandHandlerFunction } from "./CommandHandler";
import { CommandMessage } from "./CommandMessage";
import { Logger } from "../Infrastructure/Logger";
import { RepositoryFactory } from "../Infrastructure/RepositoryFactory";
import { Command } from "./Command";


export abstract class AbstractCommandBus implements CommandBus {

    protected logger: Logger;

    public constructor(logger: Logger) {
        this.logger = logger;
    }

    public register(instance: {}): void {
        const className = instance.constructor.name;

        const handledCommands = CodeMetadata.getProperty<string[]>(className, "HandledCommands", []);
        for (const commandName of handledCommands) {
            const handler = CodeMetadata.getProperty<CommandHandlerFunction>(commandName, "CommandHandlerFunction");
            if (handler !== undefined) {
                this.subscribe(
                    commandName,
                    (commandMessage): Promise<any> => handler.call(
                        instance,
                        commandMessage.payload,
                        commandMessage.metadata
                    )
                );
            }
        }
    }

    protected registerAggregateHandledCommands(): void {
        const commandNames = CodeMetadata.getProperty<string[]>("CommandBus", "AggregateHandledCommands", []);

        for (const commandName of commandNames) {
            const handlingMethod = CodeMetadata.getProperty<string>(commandName, "HandlingMethod");
            const aggregateClassName = CodeMetadata.getProperty<string>(commandName, "AggregateClass");

            if (handlingMethod === "AggregateConstructor") {
                this.subscribe(commandName, async (commandMessage): Promise<void> => {
                    const repository = RepositoryFactory.get(aggregateClassName);
                    const aggregateInstance = repository.createInstance(
                        commandMessage.payload,
                        commandMessage.metadata
                    );
                    await repository.save(aggregateInstance);
                });
            } else if (handlingMethod === "AggregateInstance") {
                const handler = CodeMetadata.getProperty<CommandHandlerFunction>(commandName, "CommandHandlerFunction");

                this.subscribe(commandName, async (commandMessage): Promise<void> => {
                    const id = commandMessage.getTargetAggregateIdentifier();
                    const repository = RepositoryFactory.get(aggregateClassName);

                    const aggregateInstance = await repository.load(id);
                    await handler.call(
                        aggregateInstance,
                        commandMessage.payload,
                        commandMessage.metadata
                    );
                    await repository.save(aggregateInstance);
                });
            } else {
                throw new Error(`Unknown handling method "${handlingMethod}"`);
            }
        }
    }

    public abstract subscribe(commandName: string, handler: CommandMessageHandler): void;

    public abstract dispatch<T extends Command<any, any>>(
        query: T,
        metadata?: any
    ): Promise<T["__COMMAND_RETURN_TYPE"]>;

    public abstract dispatch(command: any, metadata?: any): Promise<any>;
    public abstract dispatch(command: CommandMessage | any, metadata?: any): Promise<any>;

}
