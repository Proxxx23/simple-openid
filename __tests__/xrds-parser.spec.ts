import { parseXrdsData } from '../src/xrds';

describe('XRDS parser', () => {
  it('XRDS sample is parsed', () => {
    const sample = '<?xml version="1.0" encoding="UTF-8"?><xrds:XRDS xmlns:xrds="xri://$xrds" xmlns="xri://$xrd*($v*2.0)" xmlns:openid="http://openid.net/xmlns/1.0"><XRD ref="xri://=example"><Query>*example</Query><Status ceid="off" cid="verified" code="100"/><Expires>2008-05-05T00:15:00.000Z</Expires> <ProviderID>xri://=</ProviderID> <!-- synonym section --> <LocalID priority="10">!4C72.6C81.D78F.90B2</LocalID> <EquivID priority="10">http://example.com/example-user</EquivID> <EquivID priority="15">http://example.net/blog</EquivID> <CanonicalID>xri://=!4C72.6C81.D78F.90B2</CanonicalID> <!-- service section --> <Service> <!-- XRI resolution service --> <ProviderID>xri://=!F83.62B1.44F.2813</ProviderID> <Type>xri://$res*auth*($v*2.0)</Type> <MediaType>application/xrds+xml</MediaType> <URI priority=”10”>http://resolve.example.com</URI> <URI priority=”15”>http://resolve2.example.com</URI> <URI>https://resolve.example.com</URI> </Service> <!-- OpenID 2.0 login service --> <Service priority="10"> <Type>http://specs.openid.net/auth/2.0/signon</Type> <URI>http://www.myopenid.com/server</URI> <LocalID>http://example.myopenid.com/</LocalID> </Service> <!-- OpenID 1.0 login service --> <Service priority="20"> <Type>http://openid.net/server/1.0</Type> <URI>http://www.livejournal.com/openid/server.bml</URI> <openid:Delegate>http://www.livejournal.com/users/example/</openid:Delegate> </Service> <!-- untyped service for access to files of media type JPEG --> <Service priority="10"> <Type match="null" /> <Path select="true">/media/pictures</Path> <MediaType select="true">image/jpeg</MediaType> <URI append="path" >http://pictures.example.com</URI> </Service> </XRD> </xrds:XRDS>';

    const services = parseXrdsData(sample);

    expect(services).toHaveLength(3); // Won't find service with self-closing type (OK)
    expect(services).toStrictEqual(
      [
        {
          priority: 0,
          type: 'xri://$res*auth*($v*2.0)',
          uri: 'http://resolve.example.com'
        },
        {
          priority: 10,
          type: 'http://specs.openid.net/auth/2.0/signon',
          uri: 'http://www.myopenid.com/server'
        },
        {
          priority: 20,
          type: 'http://openid.net/server/1.0',
          uri: 'http://www.livejournal.com/openid/server.bml',
        }
      ]
    );
  });

  it('Steam OpenID 2.0 XRDS is parsed properly', () => {
    const xrds = '<?xml version="1.0" encoding="UTF-8"?> <xrds:XRDS xmlns:xrds="xri://$xrds" xmlns="xri://$xrd*($v*2.0)"> <XRD> <Service priority="0"> <Type>http://specs.openid.net/auth/2.0/server</Type> <URI>https://steamcommunity.com/openid/login</URI> </Service> </XRD> </xrds:XRDS>';
    const services = parseXrdsData(xrds);

    expect(services).toHaveLength(1);
    expect(services[0]).toStrictEqual({
      priority: 0,
      type: 'http://specs.openid.net/auth/2.0/server',
      uri: 'https://steamcommunity.com/openid/login',
    });
  });

  it('XRDS sample with certificate is parsed', () => {
    const sample = '<?xml version="1.0" encoding="UTF-8"?><XRDS ref="xri://=ryan" xmlns="xri://$xrds"> <XRD version="2.0" xmlns="xri://$xrd*($v*2.0)"> <Query>*ryan</Query> <Status ceid="off" cid="verified" code="100"/> <ServerStatus code="100"/> <Expires>2010-12-10T00:05:09.000Z</Expires> <ProviderID>xri://=</ProviderID> <LocalID>!6211.6637.5b81.1e16</LocalID> <CanonicalID>=!6211.6637.5B81.1E16</CanonicalID> <Service priority="10"> <ProviderID>@!26E.5985.6045.FCED</ProviderID> <Type select="true">xri://+i-service*(+contact)*($v*1.0)</Type> <Type match="null" select="false"/> <Path select="true">(+contact)</Path> <Path match="null" select="false"/> <MediaType match="default" select="false"/> <URI append="qxri">http://contact.fullxri.com/contact/</URI> </Service> <Service priority="10"> <ProviderID>@!26E.5985.6045.FCED</ProviderID> <Type select="true">xri://+i-service*(+forwarding)*($v*1.0)</Type> <Type match="null" select="false"/> <Path select="true">(+index)</Path> <Path match="non-null" select="false"/> <MediaType match="default" select="false"/> <URI append="qxri">http://forwarding.fullxri.com/forwarding/</URI> </Service> <Service priority="10"> <ProviderID>xri://=!6211.6637.5B81.1E16</ProviderID> <Type select="true">xri://$res*auth*($v*2.0)</Type> <MediaType select="false">application/xrds+xml</MediaType> <URI append="none" priority="2">http://resolve.fullxri.com/ns/=!6211.6637.5B81.1E16/</URI> <URI append="none" priority="1">https://resolve.fullxri.com/ns/=!6211.6637.5B81.1E16/</URI> </Service> <Service priority="10"> <ProviderID>@!26E.5985.6045.FCED</ProviderID> <Type select="true">xri://$xdi!($v!1)</Type> <Path select="true">($context)!($xdi)!($v!1) </Path> <MediaType match="default" select="false"/> <URI append="none">https://xdi.fullxri.com/=!6211.6637.5B81.1E16</URI> </Service> <Service priority="10"> <Type select="true">xri://$certificate*($x.509)</Type> <Path match="default" select="false"/> <MediaType match="default" select="false"/> <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"> <ds:X509Data> <ds:X509Certificate>MIIDIzCCAgugAwIBAgIGASCS6gA8MA0GCSqGSIb3DQEBBQUAMIGEMQswCQYDVQQGEwJBVDEPMA0GA1UECBMGVmllbm5hMQ8wDQYDVQQHEwZWaWVubmExETAPBgNVBAoUCEBmdWxsWFJJMR0wGwYDVQQDFBRAITI2RS41OTg1LjYwNDUuRkNFRDEhMB8GCSqGSIb3DQEJARYSb2ZmaWNlQGZ1bGx4cmkuY29tMB4XDTA5MDQxMTAyMDMxMFoXDTI5MDQxMTAyMDMxMFowIDEeMBwGA1UEAwwVPSE2MjExLjY2MzcuNUI4MS4xRTE2MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAo6LCtJ3yvnVo5UPD09jgrC6d94dwu0gqAzAHTjaVXwsEsuelJlC2psugxF970zKaglAxK/tGgW0Ycf7qjaNkhWKmZhSX8/IajQ/eUCqAggddpKLzuUjMvTTRso+WuJpIIsQfsX3WQGaUkOqxrnwHR+zrbIUJKpVCUmkp7oToW0yQMC+HTXOPW/SJrm0nIRcT+b1PN98WacRihPV/mwsNeOUiLUNfo60Apt/jM4T0UqNvfT/QmW+6/4g9+P16580uG9lbh0UOoz+TuVu1Q/cM53anZP2thpxQU0VasHyZMwpXJb8trj/kFRyTHIQ/ATE80ofNR1qTcz/O5jmmVfwKRwIDAQABMA0GCSqGSIb3DQEBBQUAA4IBAQBMpdu45L7PQR8S2vdA+vnMiDAMUoEqDQ3dr9k6lLd4yDacaGtn/w7hPx3Z3hfOt0crHGcH1TJBbA2klv5PFt2SNObn4VnckpSD065yrcRg82ZGHhNl+0ALqoHzmpnp7MxVR2Bywq5IxzGcjlJ5/Rt21hGeqETIXDzoUJM25/gSQACAADrxdzecHDs2HYtfgDTGXEJixxHFuboVgxUb1jgjVQwGAsNSgj+X3xh47z0bbZMsA0ZxekZx6vTNhRgJ3mMuYBo5Z32JZJDP9fVAR4eIYVjcaD81UaEzVFrzsMaGyHEcrKlelIwriCitx2qjzfNBS35LDW8c5+mtZOQukmoy</ds:X509Certificate> </ds:X509Data> </ds:KeyInfo> </Service> <Service priority="10"> <ProviderID>@!26E.5985.6045.FCED</ProviderID> <Type select="true">http://openid.net/signon/1.0</Type> <Type select="true">http://specs.openid.net/auth/2.0/signon</Type> <Path select="true">(+login)</Path> <Path match="default" select="false"/> <MediaType match="default" select="false"/> <URI append="none" priority="1">https://authn.fullxri.com/authentication/</URI> </Service> </XRD> </XRDS>';

    const services = parseXrdsData(sample);

    expect(services).toHaveLength(6); // Won't find x509 service due to no URI
    expect(services).toStrictEqual(
      [
        {
          priority: 10,
          type: 'xri://+i-service*(+contact)*($v*1.0)',
          uri: 'http://contact.fullxri.com/contact/',
        },
        {
          priority: 10,
          type: 'xri://+i-service*(+forwarding)*($v*1.0)',
          uri: 'http://forwarding.fullxri.com/forwarding/',
        },
        {
          priority: 10,
          type: 'xri://$res*auth*($v*2.0)',
          uri: 'http://resolve.fullxri.com/ns/=!6211.6637.5B81.1E16/',
        },
        {
          priority: 10,
          type: 'xri://$xdi!($v!1)',
          uri: 'https://xdi.fullxri.com/=!6211.6637.5B81.1E16',
        },
        {
          priority: 10,
          type: 'http://openid.net/signon/1.0',
          uri: 'https://authn.fullxri.com/authentication/',
        },
        {
          priority: 10,
          type: 'http://specs.openid.net/auth/2.0/signon',
          uri: 'https://authn.fullxri.com/authentication/',
        }
      ]
    );
  });
});
