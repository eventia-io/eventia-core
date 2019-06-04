/**
 * Represents a unit of work that can be commited or rolled back.
 */
export interface Transaction {

    begin(): Promise<void>;

    commit(): Promise<void>;
    rollback(): Promise<void>;

    release(): Promise<void>;

}
