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

        const flattenedTokens = Array.from(this.expandTokens(tokens));

        const positionalTokens = this.getPositionalTokens(flattenedTokens);
        if (positionalTokens.length > 0) {
            this.addTrackingToken(new BoundedTrackingToken(positionalTokens));
        }

        const payloadTypes = this.getPayloadFromTokens(this.getPayloadTrackingTokens(flattenedTokens));
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

    public needsCatchup(): boolean {
        for (const trackingToken of this.internalTrackingTokens) {
            if (trackingToken.needsCatchup()) {
                return true;
            }
        }

        return false;
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

    protected * expandTokens(tokens: TrackingToken[]): Iterable<TrackingToken> {
        for (const token of tokens) {
            if (token instanceof CombinedTrackingToken) {
                yield* this.expandTokens(token.internalTrackingTokens);
            } else {
                yield token;
            }
        }
    }

}
