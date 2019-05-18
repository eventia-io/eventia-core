
export class UniqueIdentifierFactory {

    public static create(): string {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char): string => {
            const random = Math.floor(Math.random() * 16);
            const value = char === "x" ? random : ((random % 4) + 8);
            return value.toString(16);
        });
    }

}
