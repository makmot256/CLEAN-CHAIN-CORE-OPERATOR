import { Buffer } from 'buffer';

declare global {
    interface Window {
        ethereum?: any;
        Buffer: typeof Buffer;
        process: any;
    }
}
export { };