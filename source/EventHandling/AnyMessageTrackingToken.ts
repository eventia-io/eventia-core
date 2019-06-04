import { TrackingToken } from "./TrackingToken";


/**
 * A tracking token that will deliver any message that is published in the event bus.
 * It's used mostly to implement subscriptions to both domain and external events.
 */

export class AnyMessageTrackingToken extends TrackingToken {

    public covers(): boolean {
        return true;
    }

    public needsCatchup(): boolean {
        return false;
    }

}
