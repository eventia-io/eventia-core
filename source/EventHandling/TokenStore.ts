import { TrackingToken } from "./TrackingToken";

/**
 * A TokenStore provides the basic functionality to retrieve, store and delete
 * tracking tokens that Tracking Event Processors can use to keep track of
 * their positions.
 */
export interface TokenStore {

    retrieveToken(processorName: string): Promise<TrackingToken | undefined>;
    storeToken(processorName: string, token: TrackingToken): Promise<void>;
    deleteToken(processorName: string): Promise<void>;

}
