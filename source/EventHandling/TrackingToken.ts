import { EventMessage } from "./EventMessage";


/**
 * A tracking token identifies the position of an event in an event stream.
 * Stream subscribers use this token to keep track of the events they've processed
 * and filter new events.
 */

export abstract class TrackingToken {

    abstract covers(message: EventMessage): boolean;
    abstract needsCatchup(): boolean;

}
