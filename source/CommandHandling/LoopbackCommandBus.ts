import { CommandMessage } from "./CommandMessage";
import { CommandMessageHandler } from "./CommandBus";
import { AbstractCommandBus } from "./AbstractCommandBus";
import { Logger } from "../Infrastructure/Logger";
import { Command } from "./Command";


export class LoopbackCommandBus extends AbstractCommandBus {

    protected readonly handlerMap = new Map<string, CommandMessageHandler>();

    public constructor(logger: Logger) {
        super(logger);
        this.registerAggregateHandledCommands();
    }

    public subscribe(commandName: string, handler: CommandMessageHandler): void {
        this.handlerMap.set(commandName, handler);
    }

    public async dispatch<T extends Command<any, any>>(query: T, metadata?: any): Promise<T["__COMMAND_RETURN_TYPE"]>;
    public async dispatch(command: any, metadata?: any): Promise<any>;
    public async dispatch(command: CommandMessage | any, metadata?: any): Promise<any> {
        const commandMessage = command instanceof CommandMessage
            ? command
            : CommandMessage.fromInstance(command, metadata);

        const commandName = commandMessage.payloadType;
        const handler = this.handlerMap.get(commandName);

        if (handler === undefined) {
            throw new Error(`No handlers registered for command "${commandName}"`);
        }

        return handler(commandMessage);
    }

}
