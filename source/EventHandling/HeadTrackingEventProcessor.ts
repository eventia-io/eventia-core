import { TrackingEventProcessor } from "./TrackingEventProcessor";
import { TrackingToken } from "./TrackingToken";


export class HeadTrackingEventProcessor extends TrackingEventProcessor {

    protected getDefaultTrackingToken(): Promise<TrackingToken> {
        return this.messageSource.createHeadToken();
    }

}
