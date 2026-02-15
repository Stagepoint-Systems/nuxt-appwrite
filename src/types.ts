/**
 * nuxt-appwrite module options
 */
export interface ModuleOptions {
  /**
   * Appwrite API endpoint.
   * Can also be set via NUXT_PUBLIC_APPWRITE_ENDPOINT env variable.
   * @example 'https://nyc.cloud.appwrite.io/v1'
   */
  endpoint?: string;

  /**
   * Appwrite project ID.
   * Can also be set via NUXT_PUBLIC_APPWRITE_PROJECT_ID env variable.
   */
  projectId?: string;

  /**
   * Default database ID for convenience helpers.
   * Can also be set via NUXT_PUBLIC_APPWRITE_DATABASE_ID env variable.
   */
  databaseId?: string;

  /**
   * Default storage bucket ID for convenience helpers.
   * Can also be set via NUXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID env variable.
   */
  storageBucketId?: string;

  /**
   * Admin team ID for role-checking helpers.
   * Can also be set via NUXT_PUBLIC_APPWRITE_ADMIN_TEAM_ID env variable.
   */
  adminTeamId?: string;

  /**
   * Server-side API key for admin operations.
   * Can also be set via NUXT_APPWRITE_API_KEY env variable.
   * This is NEVER exposed to the client.
   */
  apiKey?: string;
}

declare module "@nuxt/schema" {
  interface PublicRuntimeConfig {
    appwrite: {
      endpoint: string;
      projectId: string;
      databaseId: string;
      storageBucketId: string;
      adminTeamId: string;
    };
  }
  interface RuntimeConfig {
    appwrite: {
      apiKey: string;
    };
  }
}

declare module "nuxt/schema" {
  interface PublicRuntimeConfig {
    appwrite: {
      endpoint: string;
      projectId: string;
      databaseId: string;
      storageBucketId: string;
      adminTeamId: string;
    };
  }
  interface RuntimeConfig {
    appwrite: {
      apiKey: string;
    };
  }
}

export {};
