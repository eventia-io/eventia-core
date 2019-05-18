import { EventProcessor } from "./EventProcessor";
import { Logger } from "../Infrastructure/Logger";
import { StreamableMessageSource } from "../Messaging/StreamableMessageSource";
import { EventMessage } from "./EventMessage";
import { CodeMetadata } from "../Infrastructure/CodeMetadata";
import { EventHandlerFunction } from "./EventHandler";
import { InfiniteStream } from "../Infrastructure/InfiniteStream";


export type PayloadHandlerFunction = (event: EventMessage) => Promise<void>;

export abstract class AbstractEventProcessor implements EventProcessor {

    protected readonly logger: Logger;
    protected readonly messageSource: StreamableMessageSource;

    protected readonly payloadHandlers = new Map<string, PayloadHandlerFunction[]>();

    protected stream: InfiniteStream<EventMessage>;
    protected stopPromise: Promise<void>;
    protected readyPromise: Promise<void>;
    protected isClosing: boolean = false;

    public constructor(logger: Logger, messageSource: StreamableMessageSource) {
        this.logger = logger;
        this.messageSource = messageSource;
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
                (event): Promise<void> => fn.call(instance, event.payload, event.metadata);

            const payloadHandlers = this.payloadHandlers.get(eventClassName) || [];
            payloadHandlers.push(handler);
            this.payloadHandlers.set(eventClassName, payloadHandlers);
        }
    }

    public getName(): string {
        return this.constructor.name;
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

                await this.invoke(payloadHandlers, event);
            }
        }
    }

    protected async invoke(payloadHandlers: PayloadHandlerFunction[], event: EventMessage): Promise<void> {
        await Promise.all(
            payloadHandlers.map(handler => handler(event))
        );
    }

    protected getRegisteredPayloadHandlers(payloadType: string): PayloadHandlerFunction[] {
        const handlers = this.payloadHandlers.get(payloadType);

        return handlers || [];
    }

    protected abstract openStream(): Promise<InfiniteStream<EventMessage>>;

}
