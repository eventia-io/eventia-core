/**
 * Implements a data structure that uses a single, fixed-size buffer as if it
 * were connected end-to-end, well suited for FIFO publish-consume queues.
 */
export class CircularBuffer<T> {

    protected buffer: T[];
    protected head = 0;
    protected tail = 0;

    public constructor(capacity: number) {
        this.buffer = new Array<T>(capacity);
    }

    /**
     * Return the number of elements in the buffer.
     */
    public get length(): number {
        return this.tail - this.head;
    }

    /**
     * Returns the current capacity of the buffer, this is, the number of
     * elements that can be written before it starts overwritting unread
     * ones.
     */
    public get capacity(): number {
        return this.buffer.length - this.length;
    }

    /**
     * Writes (adds) an element to the tail of the buffer.
     * If capacity = 0, the oldest element in the buffer will be overwritten.
     * @param element The element to write into the buffer.
     */
    public write(element: T): void {
        // Never let capacity < 0
        if (this.capacity === 0) {
            this.head++;
        }

        const position = this.tail++ % this.buffer.length;
        this.buffer[position] = element;
    }

    /**
     * Reads (removes) an element from the head of the buffer.
     * If there are no elements to read, it will return undefined.
     */
    public read(): T {
        if (this.head < this.tail) {
            const position = this.head++ % this.buffer.length;
            const element = this.buffer[position];

            // Remove the element from the underlying buffer, so it
            // can be garbage collected.
            this.buffer[position] = undefined as unknown as T;

            // Prevent integer overflows in head-tail pointers.
            if (this.head === this.tail) {
                this.head = 0;
                this.tail = 0;
            }

            return element;
        }

        return undefined as unknown as T;
    }

}
