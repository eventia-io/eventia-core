import { TokenStore } from "../../EventHandling/TokenStore";
import { TrackingToken } from "../../EventHandling/TrackingToken";
import { Logger } from "../../Infrastructure/Logger";


export class InMemoryTokenStore implements TokenStore {

    protected logger: Logger;
    protected storage = new Map<string, TrackingToken>();

    public constructor(logger: Logger) {
        this.logger = logger;
    }

    public async retrieveToken(processorName: string): Promise<TrackingToken | undefined> {
        return this.storage.get(processorName);
    }

    public async storeToken(processorName: string, token: TrackingToken): Promise<void> {
        this.storage.set(processorName, token);
    }

    public async deleteToken(processorName: string): Promise<void> {
        this.storage.delete(processorName);
    }

}
