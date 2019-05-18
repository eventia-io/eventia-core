import { DTO } from "../Infrastructure/DataTransferObject";
import { ExcludeMethods } from "../Infrastructure/ExcludeMethods";


type Omit<T, K> = Pick<T, Exclude<keyof T, K>>

export class Query<T, K = {}> extends DTO<T> {

    public readonly __QUERY_RETURN_TYPE: K;

    public constructor(values?: ExcludeMethods<Omit<T, "__QUERY_RETURN_TYPE">>) {
        super(values as unknown as ExcludeMethods<T>);
    }

}
