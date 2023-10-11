import { DateTime } from 'luxon';
import * as crypto from 'crypto';
import { SteamOpenIdClient } from '../src/index';

const STEAM_OPENID_URI = 'https://steamcommunity.com/openid';
const RETURN_URL = 'https://account.yougov.com/en/account/safe/connect-oauth/steam-library/finish';

describe('Steam OpenId Client response validation', () => {
  it('Rejects validation if invalid (non OpenId) URL given', async () => {
    const client = new SteamOpenIdClient();

    await expect(
      client.validateResponse(
        'https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login',
        'https://example.com/verify'
      )
    )
      .rejects
      .toThrowError('openId.return_to query param is missing in the request URL.');
  });

  it('Rejects validation if Open ID 2.0 URL with no return URL given', async () => {
    const client = new SteamOpenIdClient();

    await expect(
      client.validateResponse(
        'https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login?openid.foo=bar',
        'https://example.com/verify'
      )
    )
      .rejects
      .toThrowError('openId.return_to query param is missing in the request URL.');
  });

  it('Rejects validation if Open ID 2.0 URL with empty return URL given', async () => {
    const client = new SteamOpenIdClient();

    await expect(
      client.validateResponse(
        'https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login?openid.return_to=',
        'https://example.com/verify'
      )
    )
      .rejects
      .toThrowError('openId.return_to query param is missing in the request URL.');
  });

  it('Rejects validation if original return url is an empty string', async () => {
    const client = new SteamOpenIdClient();
    await expect(
      client.validateResponse(
        'https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login?openid.return_to=http://example.com/verify',
        ''
      )
    )
      .rejects
      .toThrowError('OpenId Client return url is empty.');
  });

  it('Rejects validation if original return url and Open ID 2.0 return URLs are not complementary (protocols differ)', async () => {
    const client = new SteamOpenIdClient();
    await expect(
      client.validateResponse(
        'https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login?openid.return_to=http://yougov.com/redirect',
        RETURN_URL
      )
    )
      .rejects
      .toThrowError('OpenID Client and OpenID return_to URLs do not match.');
  });

  it('Rejects validation if original return url and Open ID 2.0 return URLs are not complementary (hosts differ)', async () => {
    const client = new SteamOpenIdClient();
    await expect(
      client.validateResponse(
        'https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login?openid.return_to=https://yougov.com/redirect',
        'https://yougovweirdhost.com/openid/verify'
      )
    )
      .rejects
      .toThrowError('OpenID Client and OpenID return_to URLs do not match.');
  });

  it('Rejects validation if original return url and Open ID 2.0 return URLs are not complementary (pathnames differ)', async () => {
    const client = new SteamOpenIdClient();
    await expect(
      client.validateResponse(
        'https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login?openid.return_to=https://yougov.com/redirect',
        'https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish-weird'
      )
    )
      .rejects
      .toThrowError('OpenID Client and OpenID return_to URLs do not match.');
  });

  // See to-do in steam-openid-client.ts
  it('Rejects validation if original return url and Open ID 2.0 return URLs are not complementary (return_to qs params differ)', async () => {
    const client = new SteamOpenIdClient();
    await expect(
      client.validateResponse(
        'https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login?openid.return_to=https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish?foo=bar&baz=zxc',
        'https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish?foo=bar&abc=def'
      )
    )
      .rejects
      .toThrowError('Query parameters in OpenID return_to and OpenID Client return URL do not match.');
  });

  it('Rejects validation if response nonce is missing', async () => {
    const client = new SteamOpenIdClient();
    await expect(
      client.validateResponse(
        `https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login?openid.return_to=${RETURN_URL}`,
        RETURN_URL
      )
    )
      .rejects
      .toThrowError('Missing response nonce.');
  });

  it('Rejects validation if response nonce is empty', async () => {
    const client = new SteamOpenIdClient();
    await expect(
      client.validateResponse(
        `https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login?openid.return_to=${RETURN_URL}&openid.response_nonce=`,
        RETURN_URL
      )
    )
      .rejects
      .toThrowError('Missing response nonce.');
  });

  it('Rejects validation if response nonce has invalid date format', async () => {
    const nonceString = crypto.createHmac('sha256', 'Steam').digest('base64');
    const nonce = new Date(Date.now()) + nonceString;
    const client = new SteamOpenIdClient();

    await expect(
      client.validateResponse(
        `https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login?openid.return_to=${RETURN_URL}&openid.response_nonce=${nonce}`,
        RETURN_URL
      )
    )
      .rejects
      .toThrowError('Response nonce has invalid date format or no date at all.');
  });

  it('Rejects validation if response nonce is skewed by more than 5 minutes', async () => {
    const nonceString = crypto.createHmac('sha256', 'Steam').digest('base64');
    const nonce = DateTime.fromMillis(Date.now()).minus({ minute: 10 }).toISO({ includeOffset: false })?.replace(/\.\d+/, 'Z') + nonceString; // 10 minutes back

    const client = new SteamOpenIdClient();

    await expect(
      client.validateResponse(
        `https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish/login?openid.return_to=${RETURN_URL}&openid.response_nonce=${nonce}`,
        RETURN_URL
      )
    )
      .rejects
      .toThrowError('Response nonce is skewed by more than 5 minutes.');
  });

  it('Rejects validation without signature in response URL from Steam', async () => {
    const nonceString = crypto.createHmac('sha256', 'Steam').digest('base64');
    const claimedSteamId = 'https://steamcommunity.com/openid/id/76561197994695284'; // https://steamcommunity.com/id/hardstylemaniac111/

    const nonce = new Date(Date.now()).toISOString().replace(/\.\d+Z$/, 'Z') + nonceString; // YYYY-MM-DDTHH:II:SSZ

    const client = new SteamOpenIdClient();
    await expect(
      client.validateResponse(`https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish
    ?openid.ns=http://specs.openid.net/auth/2.0
    &openid.return_to=${RETURN_URL}
    &openid.response_nonce=${nonce}
    &openid.mode=id_res
    &openid.signed=signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle
    &openid.op_endpoint=https://steamcommunity.com/openid/login
    &openid.identity=${claimedSteamId}
    &openid.claimed_id=${claimedSteamId}`.trim(),
      RETURN_URL
      ))
      .rejects
      .toThrowError('No signature in response.');
  });

  it('Rejects validation without claimed_id in response URL from Steam', async () => {
    const signature = crypto.randomBytes(28).toString('base64');
    const nonceString = crypto.createHmac('sha256', 'Steam').digest('base64');
    const claimedSteamId = 'https://steamcommunity.com/openid/id/76561197994695284'; // https://steamcommunity.com/id/hardstylemaniac111/

    const nonce = new Date(Date.now()).toISOString().replace(/\.\d+Z$/, 'Z') + nonceString; // YYYY-MM-DDTHH:II:SSZ

    const client = new SteamOpenIdClient();
    await expect(
      client.validateResponse(`https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish
    ?openid.ns=http://specs.openid.net/auth/2.0
    &openid.return_to=${RETURN_URL}
    &openid.response_nonce=${nonce}
    &openid.mode=id_res
    &openid.signed=signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle
    &openid.sig=${signature}
    &openid.op_endpoint=https://steamcommunity.com/openid/login
    &openid.identity=${claimedSteamId}`.trim(),
      RETURN_URL
      ))
      .rejects
      .toThrowError('Could not obtain claimed identifier.');
  });

  it('Rejects validation if response nonce is replied with the same hash and date', async () => {
    const signature = crypto.randomBytes(28).toString('base64');
    const nonceString = crypto.createHmac('sha256', 'Steam').digest('base64');
    const nonce = new Date(Date.now()).toISOString().replace(/\.\d+Z$/, 'Z') + nonceString; // YYYY-MM-DDTHH:II:SSZ

    const client = new SteamOpenIdClient();
    const claimedSteamId = 'https://steamcommunity.com/openid/id/76561197994695284'; // https://steamcommunity.com/id/hardstylemaniac111/

    const authentication = await client.authenticate(STEAM_OPENID_URI, RETURN_URL);
    expect(authentication).not.toBe('');

    // First validation
    const firstValidation = await client.validateResponse(`https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish
    ?openid.return_to=${RETURN_URL}
    &openid.response_nonce=${nonce}
    &openid.mode=id_res
    &openid.op_endpoint=https://steamcommunity.com/openid/login
    &openid.identity=${claimedSteamId}
    &openid.assoc_handle=1234567890
    &openid.signed=signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle
    &openid.sig=${signature}
    &openid.claimed_id=${claimedSteamId}`.trim(),
    RETURN_URL
    );
    expect(firstValidation).toBeTruthy();

    // Replayed nonce
    await expect(
      client.validateResponse(`https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish
    ?openid.return_to=${RETURN_URL}
    &openid.response_nonce=${nonce}
    &openid.mode=id_res
    &openid.op_endpoint=https://steamcommunity.com/openid/login
    &openid.identity=${claimedSteamId}
    &openid.signed=signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle
    &openid.sig=${signature}
    &openid.claimed_id=${claimedSteamId}`.trim(),
      RETURN_URL
      ))
      .rejects
      .toThrowError('Response nonce has already been used (replayed)');
  });

  it('Approves validation if response nonce is replied with the same hash but different date', async () => {
    const signature = crypto.randomBytes(28).toString('base64');
    const nonceString = crypto.createHmac('sha256', 'Steam').digest('base64');

    const firstNonce = DateTime.utc()
      .minus({ second: 10 })
      .toISO({ includeOffset: true })
      ?.replace(/\.\d+Z$/, 'Z') + nonceString; // same hash, 10 seconds ago

    const secondNonce = new Date(Date.now()).toISOString().replace(/\.\d+Z$/, 'Z') + nonceString; // YYYY-MM-DDTHH:II:SSZ

    const client = new SteamOpenIdClient();
    const claimedSteamId = 'https://steamcommunity.com/openid/id/76561197994695284'; // https://steamcommunity.com/id/hardstylemaniac111/

    const firstValidation = await client.validateResponse(`https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish
    ?openid.ns=http://specs.openid.net/auth/2.0
    &openid.return_to=${RETURN_URL}
    &openid.response_nonce=${firstNonce}
    &openid.mode=id_res
    &openid.op_endpoint=https://steamcommunity.com/openid/login
    &openid.identity=${claimedSteamId}
    &openid.signed=signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle
    &openid.sig=${signature}
    &openid.claimed_id=${claimedSteamId}`.trim(),
    RETURN_URL
    );

    expect(firstValidation).toBeTruthy();

    // Replayed nonce
    const replayedValidation = await client.validateResponse(`https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish
    ?openid.ns=http://specs.openid.net/auth/2.0
    &openid.return_to=${RETURN_URL}
    &openid.response_nonce=${secondNonce}
    &openid.mode=id_res
    &openid.op_endpoint=https://steamcommunity.com/openid/login
    &openid.identity=${claimedSteamId}
    &openid.signed=signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle
    &openid.sig=${signature}
    &openid.claimed_id=${claimedSteamId}`.trim(),
    RETURN_URL
    );

    expect(replayedValidation).toBeTruthy();
  });

  it('Approves validation if response nonce is replied with the same date but different hash', async () => {
    const signature = crypto.randomBytes(28).toString('base64');
    const nonceString = crypto.createHmac('sha256', 'Steam').digest('base64');
    const differentNonceString = crypto.createHmac('sha256', 'Steam Different').digest('base64');

    const now = new Date(Date.now()).toISOString().replace(/\.\d+Z$/, 'Z'); // YYYY-MM-DDTHH:II:SSZ
    const firstNonce = now + nonceString;
    const secondNonce = now + differentNonceString;

    const client = new SteamOpenIdClient();
    const claimedSteamId = 'https://steamcommunity.com/openid/id/76561197994695284'; // https://steamcommunity.com/id/hardstylemaniac111/

    // first nonce
    const firstValidation = await client.validateResponse(`https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish
    ?openid.ns=http://specs.openid.net/auth/2.0
    &openid.return_to=${RETURN_URL}
    &openid.response_nonce=${firstNonce}
    &openid.mode=id_res
    &openid.op_endpoint=https://steamcommunity.com/openid/login
    &openid.identity=${claimedSteamId}
    &openid.signed=signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle
    &openid.sig=${signature}
    &openid.claimed_id=${claimedSteamId}`.trim(),
    RETURN_URL
    );

    expect(firstValidation).toBeTruthy();

    // Replayed nonce
    const replayedValidation = await client.validateResponse(`https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish
    ?openid.ns=http://specs.openid.net/auth/2.0
    &openid.return_to=${RETURN_URL}
    &openid.response_nonce=${secondNonce}
    &openid.mode=id_res
    &openid.op_endpoint=https://steamcommunity.com/openid/login
    &openid.identity=${claimedSteamId}
    &openid.signed=signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle
    &openid.sig=${signature}
    &openid.claimed_id=${claimedSteamId}`.trim(),
    RETURN_URL
    );

    expect(replayedValidation).toBeTruthy();
  });

  it('Approves validation if nonce has less than five minutes', async () => {
    const signature = crypto.randomBytes(28).toString('base64');
    const nonceString = crypto.createHmac('sha256', 'Steam').digest('base64');
    const claimedSteamId = 'https://steamcommunity.com/openid/id/76561197994695284'; // https://steamcommunity.com/id/hardstylemaniac111/

    const nonce = DateTime.utc()
      .minus({ minute: 2 })
      .toISO({ includeOffset: true })
      ?.replace(/\.\d+Z$/, 'Z') + nonceString; // nonce generated 2 minutes ago

    const client = new SteamOpenIdClient();
    const validation = await client.validateResponse(`https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish
    ?openid.ns=http://specs.openid.net/auth/2.0
    &openid.return_to=${RETURN_URL}
    &openid.response_nonce=${nonce}
    &openid.mode=id_res
    &openid.op_endpoint=https://steamcommunity.com/openid/login
    &openid.identity=${claimedSteamId}
    &openid.signed=signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle
    &openid.sig=${signature}
    &openid.claimed_id=${claimedSteamId}`.trim(),
    RETURN_URL
    );

    expect(validation).toBeTruthy();
    expect(validation?.claimedIdentifier).toBe(claimedSteamId);
    expect(validation?.authenticated).toBeTruthy();
  });

  it('Approves validation if original return url and Open ID 2.0 return URLs are complementary and nonce is valid', async () => {
    const signature = crypto.randomBytes(28).toString('base64');
    const nonceString = crypto.createHmac('sha256', 'Steam').digest('base64');
    const claimedSteamId = 'https://steamcommunity.com/openid/id/76561197994695284'; // https://steamcommunity.com/id/hardstylemaniac111/

    const nonce = new Date(Date.now()).toISOString().replace(/\.\d+Z$/, 'Z') + nonceString; // YYYY-MM-DDTHH:II:SSZ

    const client = new SteamOpenIdClient();
    const assertion = await client.validateResponse(`https://account.yougov.com/us-en/account/safe/connect-oauth/steam-library/finish
    ?openid.ns=http://specs.openid.net/auth/2.0
    &openid.return_to=${RETURN_URL}
    &openid.response_nonce=${nonce}
    &openid.mode=id_res
    &openid.op_endpoint=https://steamcommunity.com/openid/login
    &openid.identity=${claimedSteamId}
    &openid.signed=signed,op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle
    &openid.sig=${signature}
    &openid.claimed_id=${claimedSteamId}`.trim(),
    RETURN_URL
    );

    expect(assertion).toBeTruthy();
    expect(assertion?.claimedIdentifier).toBe(claimedSteamId);
    expect(assertion?.authenticated).toBeTruthy();
  });
});
