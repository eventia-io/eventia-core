import { ExcludeMethods } from "./ExcludeMethods";

/**
 * Implements a type-safe structure that can be easily initialized without
 * constructor parameters for each public field.
 */
export class DTO<T> {

    public constructor(values: ExcludeMethods<T>) {
        Object.assign(this, values);
    }

}
