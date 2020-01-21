import { DTO } from "../Infrastructure/DataTransferObject";
import { ExcludeMethods } from "../Infrastructure/ExcludeMethods";


type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

export class Command<T, K = void> extends DTO<T> {

    public readonly __COMMAND_RETURN_TYPE: K;

    public constructor(values?: ExcludeMethods<Omit<T, "__COMMAND_RETURN_TYPE">>) {
        super(values as unknown as ExcludeMethods<T>);
    }

}
