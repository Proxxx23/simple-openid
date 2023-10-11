# steam-lightweight-openid

This package is designed to utilise Steam OpenId 2.0 in a lightweight and easy way.

To run it, example for Steam API:

```
import { OpenIdClient } from 'steam-lightweight-openid';

const client = new OpenIdClient();
const STEAM_OPENID_URL = 'https://steamcommunity.com/openid';
const OUR_RETURN_URL = 'https://example.com/return';

const returnUrl = await client.authenticate(STEAM_OPENID_URL, OUR_RETURN_URL);
```

Then, if user logged in and we grab the return URL, we can verify it:

```
const userResponseUrl = 'https://example.com/return?openid.assoc_handle=123&openid.signed=signed_stuff&openid.sig=signature&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0&openid.mode=id_res&openid.op_endpoint=https%3A%2F%2Fsteamcommunity.com%2Fopenid%2Flogin&openid.claimed_id=https%3A%2F%2Fsteamcommunity.com%2Fopenid%2Fid%2F12345678912345678&openid.identity=https%3A%2F%2Fsteamcommunity.com%2Fopenid%2Fid%2F12345678912345678&openid.return_to=https%3A%2F%2Fexample.com%2Freturn&openid.response_nonce=nonce&openid.assoc_handle=123&openid.signed=signed_stuff&openid.sig=signature';

const verified = await client.verifyResponse(userResponseUrl, OUR_RETURN_URL);
```

Adjust to your own OpenID 2.0 flow. You can use two methods:
* `authenticate` - to generate URL for user to login
* `verifyResponse` - to verify user response

To run tests:
```npm run test```
