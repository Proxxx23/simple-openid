import { resolveXri } from './xrds';
import { Provider } from './index';

const normalizeUrlIdentifier = (identifier: string): string | undefined => {
  let parsedIdentifier = identifier.trim();
  if (!parsedIdentifier) {
    return undefined;
  }

  if (parsedIdentifier.includes('xri://')) {
    parsedIdentifier = parsedIdentifier.slice(6);
  }

  if (/^[!$(+=@]/.test(parsedIdentifier) || parsedIdentifier.startsWith('http://') || parsedIdentifier.startsWith('https://')) {
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
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    updatedUrl = `https://xri.net/${url}?_xrd_r=application/xrds%2Bxml`; // XRDS
  }

  // Try XRDS/Yadis discovery
  const providers = await resolveXri(updatedUrl);
  if (!providers || providers.length === 0) {
    throw new Error('No providers found for identifier: ' + identifier);
  }

  return providers;
};
