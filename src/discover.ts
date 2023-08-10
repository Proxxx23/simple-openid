import { resolveXri } from './xrds';
import type { Provider } from './client';

const normalizeUrlIdentifier = (identifier: string): string | undefined => {
  let parsedIdentifier = identifier.replaceAll(/^\s+|\s+$/g, '');
  if (!parsedIdentifier) {
    return undefined;
  }

  if (parsedIdentifier.includes('xri://')) {
    parsedIdentifier = parsedIdentifier.slice(6);
  }

  if (/^[!$(+=@]/.test(parsedIdentifier) || parsedIdentifier.includes('http')) {
    return parsedIdentifier;
  }

  return 'http://' + parsedIdentifier;
};

export const discover = async (identifier: string): Promise<Provider[]> => {
  const url = normalizeUrlIdentifier(identifier);
  if (!url) {
    throw new Error('Invalid identifier. Tried to normalize: ' + (identifier || '[empty ID]'));
  }

  let updatedUrl = url;
  if (!url.includes('http')) {
    updatedUrl = `https://xri.net/${url}?_xrd_r=application/xrds%2Bxml`; // XRDS
  }

  // Try XRDS/Yadis discovery
  const providers = await resolveXri(updatedUrl);
  if (!providers || providers.length === 0) {
    throw new Error('No providers found for identifier: ' + identifier);
  }

  return providers;
};
