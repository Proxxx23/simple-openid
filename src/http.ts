import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';

const DefaultRequestTimeout = 5000;

export const get = async (url: string) => {
    const config: AxiosRequestConfig = {
        maxRedirects: 5,
        timeout: DefaultRequestTimeout,
        headers: {
            'Accept': 'application/xrds+xml,text/html,text/plain,*/*;q=0.9'
        },
        transformResponse: a => a
    };

    return await axios.get<string>(url, config);
};
