export type AppConfig = {
  nodeEnv: string;
  name: string;
  workingDirectory: string;
  frontendDomain?: string;
  backendDomain: string;
  apiPrefix: string;
  port: number;
  fallbackLanguage: string;
  headerLanguage: string;
};
