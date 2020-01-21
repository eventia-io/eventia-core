import { CommandMessage } from "./CommandMessage";
import { Command } from "./Command";


export type CommandMessageHandler = (commandMessage: CommandMessage) => Promise<void>;
export type CommandResponse<T extends Command<any>> = Promise<T["__COMMAND_RETURN_TYPE"]>;

export interface CommandBus {

    subscribe(commandName: string, handler: CommandMessageHandler): void;

    dispatch(commandMessage: CommandMessage): Promise<any>;
    dispatch<T extends Command<any, any>>(command: T, metadata?: any): Promise<T["__COMMAND_RETURN_TYPE"]>;
    dispatch(command: any, metadata?: any): Promise<any>;

}
