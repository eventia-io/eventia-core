
/**
 * An Event Processor subscribes to event messages from an event bus and publishes them
 * to a group of registered event handlers. This allows attributes and behaviour to be applied
 * as a whole.
 */
export interface EventProcessor {

    /**
     * Returns the name of the Event Processor.
     * The name is used to identify multiple running instances of the same logical
     * event processor distributed in different processes.
     */
    getName(): string;

    /**
     * Starts processing events.
     */
    start(): void;

    /**
     * Stop processing events.
     */
    stop(): void;

}
