import { discover } from '../src/discover';
import { OpenIdClient } from '../src/client';

const RETURN_URL = 'https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish';
const STEAM_OPENID_IDENTIFIER = 'https://steamcommunity.com/openid';

describe('OpenID authenticate and discover', () => {
  it('Throws on trying to discover an empty identifier', async () => {
    await expect(discover('')).rejects.toThrowError('Invalid identifier');
  });

  it('Discovers Steam OpenID 2.0 identifier', async () => {
    await expect(discover(STEAM_OPENID_IDENTIFIER)).resolves.toHaveLength(1);
  });
});

it('Authenticates for Steam OpenID 2.0', async () => {
  const client = new OpenIdClient();
  const returnUrl = await client.authenticate(STEAM_OPENID_IDENTIFIER, RETURN_URL);

  expect(returnUrl).toBeTruthy();
  expect(returnUrl).toContain('https://steamcommunity.com/openid/login');
});
