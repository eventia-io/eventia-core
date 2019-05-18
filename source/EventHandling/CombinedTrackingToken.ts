import { TrackingToken } from "./TrackingToken";
import { EventMessage } from "./EventMessage";
import { PositionalTrackingToken, BoundedTrackingToken } from "./PositionalTrackingToken";
import { PayloadTrackingToken } from "./PayloadTrackingToken";


/**
 * A tracking token that is made of multiple tracking tokens.
 */
export class CombinedTrackingToken extends TrackingToken {

    private readonly internalTrackingTokens: TrackingToken[] = [];

    public constructor(tokens: TrackingToken[]) {
        super();

        const positionalTokens = this.getPositionalTokens(tokens);
        if (positionalTokens.length > 0) {
            this.addTrackingToken(new BoundedTrackingToken(positionalTokens));
        }

        const payloadTypes = this.getPayloadFromTokens(this.getPayloadTrackingTokens(tokens));
        if (payloadTypes.length > 0) {
            this.addTrackingToken(new PayloadTrackingToken(payloadTypes));
        }
    }

    public get trackingTokens(): readonly TrackingToken[] {
        return this.internalTrackingTokens;
    }

    public covers(eventMessage: EventMessage): boolean {
        for (const trackingToken of this.internalTrackingTokens) {
            if (trackingToken.covers(eventMessage) === false) {
                return false;
            }
        }

        return true;
    }

    protected addTrackingToken(trackingTokenOrTokens: TrackingToken | TrackingToken[]): void {
        if (Array.isArray(trackingTokenOrTokens)) {
            for (const trackingToken of trackingTokenOrTokens) {
                this.internalTrackingTokens.push(trackingToken);
            }
        } else {
            this.internalTrackingTokens.push(trackingTokenOrTokens);
        }
    }

    protected getPositionalTokens(tokens: TrackingToken[]): TrackingToken[] {
        return tokens.filter(
            token => token instanceof PositionalTrackingToken ||
                token instanceof BoundedTrackingToken
        );
    }

    protected getPayloadTrackingTokens(tokens: TrackingToken[]): TrackingToken[] {
        return tokens.filter(
            token => token instanceof PayloadTrackingToken
        );
    }

    protected getPayloadFromTokens(tokens: TrackingToken[]): string[] {
        const payloadTypes: string[] = [];

        for (const token of tokens) {
            payloadTypes.push(...(token as PayloadTrackingToken).payloadTypes);
        }

        return payloadTypes;
    }

}
