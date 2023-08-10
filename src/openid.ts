export type ProviderResponse = {
  authenticated?: boolean,
  claimedIdentifier?: string
};

type AuthUrl = string;

export interface OpenId {
  authenticate(identifier: string, returnUrl: string): Promise<AuthUrl>;
  validateResponse(responseUrl: string, returnUrl: string): Promise<ProviderResponse>;
}
