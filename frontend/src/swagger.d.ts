declare module '@/../../docs/swagger.json' {
  const value: {
    swagger: string;
    info: Record<string, unknown>;
    paths: Record<string, Record<string, unknown>>;
    definitions: Record<string, unknown>;
  };
  export default value;
}
