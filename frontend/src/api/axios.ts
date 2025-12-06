import { api } from './client';
import { AxiosRequestConfig } from 'axios';

export const customInstance = <T>(
  config: AxiosRequestConfig,
): Promise<T> => {
  const source = api.CancelToken.source();
  const promise = api({ ...config, cancelToken: source.token }).then(
    ({ data }) => data,
  );

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export default customInstance;
