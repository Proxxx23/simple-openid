import { get } from './http';
import { Provider } from './index';

type ParsedService = {
  priority: number,
  type: string,
};

type Service = Partial<{
  uri: string,
}> & ParsedService;

export const parseXrdsData = (data: string): Service[] => {
  data = data.replaceAll(/[\n\r]/g, '');
  const services: Service[] = [];
  const serviceMatches = data.match(/<Service\s*(priority="\d+")?.*?>(.*?)<\/Service>/g);

  if (!serviceMatches) {
    return services;
  }

  for (let s = 0, len = serviceMatches.length; s < len; ++s) {
    const service = serviceMatches[s];
    const svcs: ParsedService[] = [];
    let svc: Service | undefined;

    const priorityMatch = /<Service.*?priority="(.*?)".*?>/g.exec(service);
    let priority = 0;
    if (priorityMatch) {
      priority = parseInt(priorityMatch[1], 10);
    }

    let typeMatch: RegExpExecArray | null = null;
    const typeRegex = /<Type(\s+.*?)?>(.*?)<\/Type\s*?>/g;
    while (typeMatch = typeRegex.exec(service)) {
      svcs.push(
        {
          priority: priority,
          type: typeMatch[2]
        }
      );
    }

    if (svcs.length === 0) {
      continue;
    }

    const uriMatch = /<URI(\s+.*?)?>(.*?)<\/URI\s*?>/g.exec(service);
    if (!uriMatch) {
      continue;
    }

    for (const srv of svcs) {
      svc = srv;
      svc.uri = uriMatch[2];
    }

    services.push(...svcs);
  }

  services.sort((a, b) => a.priority < b.priority
    ? -1
    : (a.priority === b.priority ? 0 : 1));

  return services;
};

const retrieveProvidersFromXrds = async (xrdsData: string): Promise<Provider[] | undefined> => {
  const services = parseXrdsData(xrdsData);
  if (services.length === 0) {
    return undefined;
  }

  const providers: Provider[] = [];
  for (const srv of services) {
    providers.push(
      {
        endpoint: srv.uri,
        version: 'http://specs.openid.net/auth/2.0',
      }
    );
  }

  return providers;
};

export const resolveXri = async (xriUrl: string): Promise<Provider[] | undefined> => {
  const { data, status, headers } = await get(xriUrl);
  if (!data || status !== 200) {
    throw new Error(`Could not resolve XRI from URL: ${xriUrl}`);
  }

  const contentType = headers?.['content-type'];
  if (!contentType) {
    throw new Error(`Could not resolve XRI from URL: ${xriUrl} due to missing content-type header.`);
  }

  if (!contentType.includes('application/xrds+xml')) {
    throw new Error(
      `Could not resolve XRI: ${xriUrl} due to invalid content-type header. Content type: ${contentType}. Expected: application/xrds+xml.`
    );
  }

  return await retrieveProvidersFromXrds(data);
};
