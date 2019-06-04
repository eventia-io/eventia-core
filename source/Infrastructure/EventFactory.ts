
export type Constructable = new (...args: any[]) => any;

export class EventFactory {

    private static classMap = new Map<string, Constructable>();

    public static register(className: string, ctor: Constructable): void {
        this.classMap.set(className, ctor);
    }

    public static createInstance(className: string, ...args: any[]): any {
        const ctor = this.classMap.get(className);

        if (ctor === undefined) {
            throw new Error(`Class ${className} not registered as a constructable event`);
        }

        return new ctor(...args);
    }

}
