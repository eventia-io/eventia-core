import { Message } from "./Message";


export interface MessageInterceptor<T extends Message<any>> {

    handle(message: T): Promise<T>;

}
