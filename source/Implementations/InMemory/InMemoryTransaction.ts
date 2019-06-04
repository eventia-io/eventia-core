import { Transaction } from "../../Infrastructure/Transaction";
import { TrackedDomainEventMessage } from "../../EventHandling/TrackedDomainEventMessage";
import { Logger } from "../../Infrastructure/Logger";


export class InMemoryTransaction implements Transaction {

    protected logger: Logger;
    protected storage: TrackedDomainEventMessage[];
    protected events: TrackedDomainEventMessage[] = [];
    protected beginCount: number = 0;
    protected rolledBack: boolean = false;

    public constructor(logger: Logger, storage: TrackedDomainEventMessage[]) {
        this.logger = logger;
        this.storage = storage;
    }

    public async begin(): Promise<void> {
        if (this.rolledBack === true) {
            throw new Error(
                "InMemoryTransaction.begin() called after rollback"
            );
        }

        this.beginCount++;
    }

    public async commit(): Promise<void> {
        if (this.rolledBack === true) {
            throw new Error(
                "InMemoryTransaction.commit() called after rollback"
            );
        }

        this.beginCount--;

        if (this.beginCount < 0) {
            throw new Error(
                "InMemoryTransaction.commit() called more times than begin()."
            );
        }
    }

    public async rollback(): Promise<void> {
        if (this.rolledBack === true) {
            return;
        }

        if (this.beginCount > 0) {
            if (this.events.length > 0) {
                // TODO: Remove events from storage
            }

            this.events.length = 0;
            this.rolledBack = true;
        } else {
            throw new Error(
                "InMemoryTransaction.rollback() called with no active transaction."
            );
        }
    }

    public async release(): Promise<void> {
        if (this.beginCount > 0 && this.rolledBack === false) {
            throw new Error(
                "InMemoryTransaction.release() called with an active transaction"
            );
        }
    }

    public append(event: TrackedDomainEventMessage): void {
        if (this.rolledBack === true) {
            throw new Error(
                "InMemoryTransaction.append() called after rollback"
            );
        }

        if (this.beginCount === 0) {
            throw new Error(
                "InMemoryTransaction.append() called before begining the transaction"
            );
        }

        this.events.push(event);
    }

}
