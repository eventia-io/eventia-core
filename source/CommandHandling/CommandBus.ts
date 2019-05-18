import { CommandMessage } from "./CommandMessage";


export type CommandMessageHandler = (commandMessage: CommandMessage) => Promise<void>;

export interface CommandBus {

    subscribe(commandName: string, handler: CommandMessageHandler): void;
    dispatch(commandMessage: CommandMessage): Promise<void>;
    dispatch(command: any, metadata?: any): Promise<void>;

}
