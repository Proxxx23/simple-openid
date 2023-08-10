import { discover } from '../src/discover';

const STEAM_OPENID_URI = 'https://steamcommunity.com/openid';

describe('XRDS OpenID discovery', () => {
  it('Discovers Steam Open ID 2.0 XRDS', async () => {
    const discovered = await discover(STEAM_OPENID_URI);

    expect(discovered).toHaveLength(1);
    expect(discovered?.[0]).toStrictEqual({
      version: 'http://specs.openid.net/auth/2.0',
      endpoint: 'https://steamcommunity.com/openid/login',
    });
  });
});
