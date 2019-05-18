import "reflect-metadata";
import { Logger } from "./Logger";


export abstract class CodeMetadata {

    private static propertyMaps = new Map<string, Map<string, any>>();

    public static setProperty<T>(key: string, property: string, value: T): void {
        this.getPropertyMap(key).set(property, value);
    }

    public static getProperty<T>(key: string, property: string, defaultValue?: T): T {
        return this.getPropertyMap(key).get(property) || defaultValue;
    }

    public static dump(logger: Logger): void {
        for (const [key, value] of this.propertyMaps) {
            logger.info("CodeMetadata:", key);
            for (const [k, v] of value) {
                logger.info("  ", k, "->", v);
            }
        }
    }

    private static getPropertyMap(key: string): Map<string, any> {
        let propertyMap = this.propertyMaps.get(key);
        if (propertyMap === undefined) {
            propertyMap = new Map<string, any>();
            this.propertyMaps.set(key, propertyMap);
        }

        return propertyMap;
    }

}
