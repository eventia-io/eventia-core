import { TrackingToken } from "./TrackingToken";
import { EventMessage } from "./EventMessage";


/**
 * A tracking token that denotes a filter based on the event's payload type
 */
export class PayloadTrackingToken extends TrackingToken {

    public readonly internalPayloadTypes = new Set<string>();;

    public constructor(payloadType: string);
    public constructor(payloadTypes: string[]);
    public constructor(payloadTypeOrTypes: string | string[]) {
        super();
        this.addPayloadType(payloadTypeOrTypes);
    }

    public get payloadTypes(): Set<string> {
        return this.internalPayloadTypes;
    }

    public addPayloadType(payloadTypeOrTypes: string | string[]): void {
        if (Array.isArray(payloadTypeOrTypes)) {
            for (const payloadType of payloadTypeOrTypes) {
                this.internalPayloadTypes.add(payloadType);
            }
        } else {
            this.internalPayloadTypes.add(payloadTypeOrTypes);
        }
    }

    public covers(eventMessage: EventMessage): boolean {
        return this.internalPayloadTypes.has(eventMessage.payloadType);
    }

}
