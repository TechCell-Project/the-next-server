// fb.d.ts
declare module 'fb' {
    export class Facebook {
        constructor(config: { appId: string; appSecret: string; version: string });
        setAccessToken(token: string): void;
        api(path: string, method?: string, params?: any, callback?: (response: any) => void): any;
    }
}
