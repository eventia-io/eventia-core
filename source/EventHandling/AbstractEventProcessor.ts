import { EventProcessor } from "./EventProcessor";
import { Logger } from "../Infrastructure/Logger";
import { StreamableMessageSource } from "../Messaging/StreamableMessageSource";
import { EventMessage } from "./EventMessage";
import { CodeMetadata } from "../Infrastructure/CodeMetadata";
import { EventHandlerFunction } from "./EventHandler";
import { InfiniteStream } from "../Infrastructure/InfiniteStream";
import { EventFactory } from "../Infrastructure/EventFactory";
import { TrackingToken } from "./TrackingToken";
import { PayloadTrackingToken } from "./PayloadTrackingToken";


export type PayloadHandlerFunction = (event: EventMessage) => Promise<void>;
export type ErrorHandlerFunction = (error: Error, event: EventMessage) => Promise<void>;

export abstract class AbstractEventProcessor implements EventProcessor {

    protected readonly logger: Logger;
    protected readonly messageSource: StreamableMessageSource;
    protected readonly name?: string;

    protected readonly payloadHandlers = new Map<string, PayloadHandlerFunction[]>();
    protected readonly errorHandlers: ErrorHandlerFunction[] = [];

    protected stream: InfiniteStream<EventMessage>;
    protected stopPromise: Promise<void>;
    protected readyPromise: Promise<void>;
    protected isClosing = false;

    public constructor(logger: Logger, messageSource: StreamableMessageSource, name?: string) {
        this.logger = logger;
        this.messageSource = messageSource;
        this.name = name;
    }

    public register(instance: {}): void {
        const className = instance.constructor.name;
        const handledEvents = CodeMetadata.getProperty<string[]>(
            className,
            "EventHandlers",
            []
        );

        for (const eventClassName of handledEvents) {
            const key = `EventHandlerFunction.${className}`;
            const fn = CodeMetadata.getProperty<EventHandlerFunction>(
                eventClassName,
                key
            );

            if (fn === undefined) {
                throw Error(`No EventHandler found for event ${eventClassName} in class ${className}`);
            }

            const handler: PayloadHandlerFunction =
                (event): Promise<void> => fn.call(
                    instance,
                    EventFactory.createInstance(event.payloadType, event.payload),
                    event.metadata,
                    event
                );

            const payloadHandlers = this.payloadHandlers.get(eventClassName) || [];
            payloadHandlers.push(handler);
            this.payloadHandlers.set(eventClassName, payloadHandlers);
        }
    }

    public getName(): string {
        return this.name || this.constructor.name;
    }

    public async start(): Promise<void> {
        if (this.stream !== undefined) {
            throw new Error(`EventProcessor ${this.getName()} is already started`);
        }

        this.stream = await this.openStream();
        this.stopPromise = new Promise<void>((resolve) => {
            this.stream.on("close", () => resolve());
        });
        this.readyPromise = new Promise<void>((resolve) => {
            this.stream.on("ready", () => resolve());
        });

        this.processEvents();

        return this.readyPromise;
    }

    public stop(): Promise<void> {
        if (this.stream === undefined || this.isClosing === true) {
            throw new Error(`EventProcessor ${this.getName()} is already stopped`);
        }

        this.isClosing = true;
        this.stream.close();

        return this.stopPromise || Promise.resolve();
    }

    public registerErrorHandler(handler: ErrorHandlerFunction): void {
        this.errorHandlers.push(handler);
    }

    protected async handleError(error: any, event: any): Promise<void> {
        if (this.errorHandlers.length === 0) {
            throw error;
        }

        for (const errorHandler of this.errorHandlers) {
            await errorHandler(error, event);
        }
    }

    protected async processEvents(): Promise<void> {
        const processorName = this.getName();

        for await (const event of this.stream) {
            if (this.isClosing) {
                break;
            }

            if (event === undefined) {
                this.logger.error(
                    "EventProcesor %s received an undefined event",
                    processorName
                );
            } else {
                const payloadHandlers = this.getRegisteredPayloadHandlers(event.payloadType);

                if (payloadHandlers === undefined || payloadHandlers.length === 0) {
                    this.logger.error(
                        "EventProcesor %s received an unexpected message payload %s",
                        processorName,
                        event.payloadType
                    );
                }

                try {
                    await this.invoke(payloadHandlers, event);
                } catch (error) {
                    await this.handleError(error, event);
                }
            }
        }
    }

    protected async invoke(payloadHandlers: PayloadHandlerFunction[], event: EventMessage): Promise<void> {
        await Promise.all(
            payloadHandlers.map((handler) => handler(event))
        );
    }

    protected getRegisteredPayloadHandlers(payloadType: string): PayloadHandlerFunction[] {
        const handlers = this.payloadHandlers.get(payloadType);

        return handlers || [];
    }

    protected getPayloadTypeTrackingToken(): TrackingToken {
        const payloadTypes = Array.from(this.payloadHandlers.keys());

        return new PayloadTrackingToken(payloadTypes);
    }

    protected abstract openStream(): Promise<InfiniteStream<EventMessage>>;

}
