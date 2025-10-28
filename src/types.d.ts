// subfinder.d.ts

declare module 'subfinder' {
    export class Subfinder {
        findSubdomains(domain: string): Promise<string[]>;
    }
}