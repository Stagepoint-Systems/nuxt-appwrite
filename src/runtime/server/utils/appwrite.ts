import {
  Client,
  Databases,
  Users,
  Teams,
  Storage,
  Account,
  Messaging,
} from "node-appwrite";
import { useRuntimeConfig } from "#imports";

// ─── Singleton Cache ────────────────────────────────────────
let _adminClient: ReturnType<typeof _createAdminClient> | null = null;

function _createAdminClient() {
  const config = useRuntimeConfig();
  const { endpoint, projectId } = config.public.appwrite;
  const { apiKey } = config.appwrite;

  if (!endpoint || !projectId) {
    throw new Error(
      "[nuxt-appwrite] Server: Missing endpoint or projectId. " +
        "Set NUXT_PUBLIC_APPWRITE_ENDPOINT and NUXT_PUBLIC_APPWRITE_PROJECT_ID.",
    );
  }

  if (!apiKey) {
    throw new Error(
      "[nuxt-appwrite] Server: Missing API key. " +
        "Set NUXT_APPWRITE_API_KEY to enable admin operations.",
    );
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  return {
    client,
    databases: new Databases(client),
    users: new Users(client),
    teams: new Teams(client),
    storage: new Storage(client),
    messaging: new Messaging(client),
  };
}

/**
 * Returns a singleton admin Appwrite client for server-side operations.
 * Uses the API key from NUXT_APPWRITE_API_KEY for full access.
 *
 * Auto-imported in all Nitro server routes — no manual import needed.
 *
 * @example
 * ```ts
 * // server/api/users/[id].get.ts
 * export default defineEventHandler(async (event) => {
 *   const { users } = useAppwriteAdmin()
 *   const id = getRouterParam(event, 'id')
 *   return await users.get(id!)
 * })
 * ```
 */
export function useAppwriteAdmin() {
  if (!_adminClient) {
    _adminClient = _createAdminClient();
  }
  return _adminClient;
}

/**
 * Creates a scoped Appwrite client for JWT-based authentication.
 * Does NOT use the API key — the caller must set the JWT.
 *
 * This is NOT a singleton — each call creates a fresh client instance
 * to avoid JWT leakage between requests.
 *
 * Auto-imported in all Nitro server routes — no manual import needed.
 *
 * @example
 * ```ts
 * // server/api/me.get.ts
 * export default defineEventHandler(async (event) => {
 *   const jwt = getHeader(event, 'Authorization')?.replace('Bearer ', '')
 *   if (!jwt) throw createError({ statusCode: 401 })
 *
 *   const { client, account, databases } = useAppwriteJWT()
 *   client.setJWT(jwt)
 *
 *   const user = await account.get()
 *   return user
 * })
 * ```
 */
export function useAppwriteJWT() {
  const config = useRuntimeConfig();
  const { endpoint, projectId } = config.public.appwrite;

  if (!endpoint || !projectId) {
    throw new Error("[nuxt-appwrite] Server: Missing endpoint or projectId.");
  }

  const client = new Client().setEndpoint(endpoint).setProject(projectId);

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
  };
}

/**
 * Returns the configured database ID from runtime config.
 * Convenience for server routes that need the default database ID.
 */
export function useAppwriteDatabaseId(): string {
  const config = useRuntimeConfig();
  return config.public.appwrite.databaseId;
}

/**
 * Returns the configured storage bucket ID from runtime config.
 */
export function useAppwriteStorageBucketId(): string {
  const config = useRuntimeConfig();
  return config.public.appwrite.storageBucketId;
}
