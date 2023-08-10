declare module 'lightweight-openid' {
    export class OpenIdClient {
        authenticate(identifier: string, returnUrl: string): Promise<AuthUrl>;
        validateResponse(responseUrl: string, returnUrl: string): Promise<ProviderResponse>;
    }

    export type ProviderResponse = {
        authenticated?: boolean;
        claimedIdentifier?: string;
    };

    export type AuthUrl = string;
}
