import * as crypto from 'crypto';
import { OpenIdClient } from '../src/client';

describe('Cancelled OpenID 2.0 authentication', () => {
  it('Does not authenticate cancelled verification', async () => {
    const hash = crypto.randomBytes(16).toString('hex');
    const nonce = new Date(Date.now()).toISOString().replace(/\.\d+Z$/, 'Z') + hash; // YYYY-MM-DDTHH:II:SSZ

    const client = new OpenIdClient();
    const claimedSteamId = 'https://steamcommunity.com/openid/id/76561197994695284'; // https://steamcommunity.com/id/hardstylemaniac111/

    await expect(
      client.validateResponse(
        `https://steamcommunity.com/openid?openid.ns=http://specs.openid.net/auth/2.0&openid.return_to=https://yougov.com/openid/verify&openid.response_nonce=${nonce}&openid.mode=cancel&openid.op_endpoint=https://steamcommunity.com/openid/login&openid.identity=${claimedSteamId}&openid.signed=field1,field2&openid.sig=${hash}&openid.claimed_id=${claimedSteamId}`,
        'https://yougov.com/openid/verify'
      )
    )
      .rejects
      .toThrowError('');
  });
});
