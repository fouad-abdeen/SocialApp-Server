export const throwError = (message: string, httpCode: number) => {
  const error: Error & { httpCode?: number } = new Error(message);
  error.httpCode = httpCode;
  throw error;
};
