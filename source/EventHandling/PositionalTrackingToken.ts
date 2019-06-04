import { TrackingToken } from "./TrackingToken";
import { EventMessage } from "./EventMessage";
import { TrackedDomainEventMessage } from "./TrackedDomainEventMessage";


/**
 * A tracking token that denotes a position. Mostly used by returned event streams
 * to indicate the position of a single event in the stream.
 */
export class PositionalTrackingToken extends TrackingToken {

    private readonly internalPosition: number;

    public constructor(position: number | TrackingToken) {
        super();

        if (position instanceof PositionalTrackingToken) {
            this.internalPosition = position.position;
        } else if (typeof position === "number") {
            this.internalPosition = position;
        } else {
            throw new Error(`Cannot set a PositionalTrackingToken from a ${position.constructor.name}`);
        }
    }

    public get position(): number {
        return this.internalPosition;
    }

    public lowerBound(other: TrackingToken): TrackingToken {
        if (other instanceof PositionalTrackingToken && this instanceof PositionalTrackingToken) {
            return new PositionalTrackingToken(Math.min(this.position, other.position));
        }

        throw new Error("Lower bound not supported on non positional tracking tokens");
    }

    public upperBound(other: TrackingToken): TrackingToken {
        if (other instanceof PositionalTrackingToken && this instanceof PositionalTrackingToken) {
            return new PositionalTrackingToken(Math.max(this.position, other.position));
        }

        throw new Error("Upper bound not supported on non positional tracking tokens");
    }

    public covers(eventMessage: EventMessage): boolean {
        if (eventMessage instanceof TrackedDomainEventMessage &&
            eventMessage.trackingToken instanceof PositionalTrackingToken) {
            return this.position === eventMessage.trackingToken.position;
        }

        throw new Error("Unsupported TrackingToken covering check operation");
    }

    public needsCatchup(): boolean {
        return true;
    }

}


/**
 * A tracking token that denotes a lower bound for the stream.
 * This token will only deliver messages whose position is greater than
 * its position.
 */
export class LowerBoundTrackingToken extends PositionalTrackingToken {

    public covers(domainEventMessage: TrackedDomainEventMessage): boolean {
        if (domainEventMessage.trackingToken instanceof PositionalTrackingToken) {
            return domainEventMessage.trackingToken.position > this.position;
        }

        throw new Error("Unsupported TrackingToken covering check operation");
    }

}

/**
 * A tracking token that denotes a upper bound for the stream.
 * This token will only deliver messages whose position is less than
 * its position.
 */
export class UpperBoundTrackingToken extends PositionalTrackingToken {

    public covers(eventMessage: EventMessage): boolean {
        if (eventMessage instanceof TrackedDomainEventMessage &&
            eventMessage.trackingToken instanceof PositionalTrackingToken) {
            return eventMessage.trackingToken.position <= this.position;
        }

        throw new Error("Unsupported TrackingToken covering check operation");
    }

}

/**
 * A tracking token that denotes a bound for the stream.
 * This token will only deliver messages whose position is greater than
 * its lower bound or less than its upper bound.
 */
export class BoundedTrackingToken implements TrackingToken {

    private readonly internalUpperBound: LowerBoundTrackingToken;
    private readonly internalLowerBound: UpperBoundTrackingToken;

    public constructor(bounds: TrackingToken[]);
    public constructor(lowerBound: TrackingToken | number,
        upperBound: TrackingToken | number
    );

    public constructor(
        lowerBoundOrBounds: TrackingToken[] | TrackingToken | number,
        upperBound?: TrackingToken | number
    ) {
        if (Array.isArray(lowerBoundOrBounds)) {
            const { maximum, minimum } = this.calculateBoundsFromArray(lowerBoundOrBounds);

            this.internalLowerBound = new PositionalTrackingToken(minimum);
            this.internalUpperBound = new PositionalTrackingToken(maximum);
        } else {
            this.internalLowerBound = new PositionalTrackingToken(lowerBoundOrBounds);
            this.internalUpperBound = new PositionalTrackingToken(
                upperBound === undefined
                    ? lowerBoundOrBounds
                    : upperBound
            );
        }
    }

    public get lowerBound(): LowerBoundTrackingToken {
        return this.internalLowerBound;
    }

    public get upperBound(): UpperBoundTrackingToken {
        return this.internalUpperBound;
    }

    public covers(eventMessage: EventMessage): boolean {
        if (eventMessage instanceof TrackedDomainEventMessage &&
            eventMessage.trackingToken instanceof PositionalTrackingToken) {
            return eventMessage.trackingToken.position > this.lowerBound.position &&
                eventMessage.trackingToken.position <= this.upperBound.position;
        }

        throw new Error("Unsupported TrackingToken covering check operation");
    }

    public needsCatchup(): boolean {
        return true;
    }

    protected calculateBoundsFromArray(bounds: TrackingToken[]): { maximum: number; minimum: number } {
        let minimum = Infinity;
        let maximum = 0;

        for (const bound of bounds) {
            if (bound instanceof UpperBoundTrackingToken) {
                maximum = Math.max(maximum, bound.position);
            } else if (bound instanceof LowerBoundTrackingToken) {
                minimum = Math.min(minimum, bound.position);
            } else if (bound instanceof PositionalTrackingToken) {
                minimum = Math.min(minimum, bound.position);
            } else if (bound instanceof BoundedTrackingToken) {
                minimum = Math.min(minimum, bound.lowerBound.position);
                maximum = Math.max(maximum, bound.upperBound.position);
            }
        }

        if (minimum >= maximum) {
            maximum = Infinity;
        }

        return { maximum, minimum };
    }

}
