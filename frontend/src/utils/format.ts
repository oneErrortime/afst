export const formatDateTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};

export const formatMethod = (method: string) => {
  const palette: Record<string, string> = {
    GET: '#86efac',
    POST: '#93c5fd',
    PUT: '#f5d0fe',
    DELETE: '#fca5a5',
    PATCH: '#fdba74'
  };
  const color = palette[method.toUpperCase()] || '#e5e7eb';
  return { label: method.toUpperCase(), color };
};
