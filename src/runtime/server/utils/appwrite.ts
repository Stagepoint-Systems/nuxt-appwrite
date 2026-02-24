import {
  Client,
  Databases,
  Users,
  Teams,
  Storage,
  Account,
  Messaging,
  Functions,
} from "node-appwrite";
import type { Models } from "node-appwrite";
import { type H3Event, getHeader, parseCookies, createError } from "h3";
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
    account: new Account(client),
    databases: new Databases(client),
    users: new Users(client),
    teams: new Teams(client),
    storage: new Storage(client),
    messaging: new Messaging(client),
    functions: new Functions(client),
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
 *   return await users.get({ userId: id! })
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
    storage: new Storage(client),
    teams: new Teams(client),
    functions: new Functions(client),
  };
}

// ─── Session Verification ────────────────────────────────────

/**
 * Extracts session credentials from an H3 request.
 *
 * Discovery order:
 *  1. `Authorization: Bearer <sessionId>` header
 *  2. `x-appwrite-session` header (explicit session ID)
 *  3. `a_session_<projectId>` cookie (Appwrite's default cookie name)
 *
 * The user ID is read from the `x-appwrite-user-id` header.
 */
function _extractSessionCredentials(event: H3Event): {
  sessionId: string | null;
  userId: string | null;
} {
  const config = useRuntimeConfig();

  let sessionId: string | null = null;

  // 1. Authorization header
  const authHeader = getHeader(event, "Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    sessionId = authHeader.slice(7);
  }

  // 2. Explicit session header
  if (!sessionId) {
    sessionId = getHeader(event, "x-appwrite-session") ?? null;
  }

  // 3. Appwrite cookie fallback
  if (!sessionId) {
    const cookies = parseCookies(event);
    const projectId = config.public.appwrite.projectId;
    if (projectId) {
      sessionId =
        cookies[`a_session_${projectId}`] ??
        cookies[`a_session_${projectId}_legacy`] ??
        null;
    }
  }

  // User ID from explicit header
  const userId = getHeader(event, "x-appwrite-user-id") ?? null;

  return { sessionId, userId };
}

/**
 * Verifies the caller's identity via the admin SDK.
 *
 * This is the recommended way to authenticate server-side requests when
 * the client uses Appwrite's browser SDK for session management.
 *
 * The client must send two pieces of information:
 *  - Session ID: via `Authorization: Bearer <id>` or `x-appwrite-session` header
 *  - User ID: via `x-appwrite-user-id` header
 *
 * The function uses the admin SDK to:
 *  1. Verify the user exists
 *  2. Verify the session belongs to the user and is not expired
 *
 * Auto-imported in all Nitro server routes — no manual import needed.
 *
 * @returns The verified Appwrite user object (includes labels, email, etc.)
 * @throws 401 createError if authentication fails
 *
 * @example
 * ```ts
 * // server/api/me.get.ts
 * export default defineEventHandler(async (event) => {
 *   const user = await useAppwriteSession(event)
 *   return { id: user.$id, name: user.name, labels: user.labels }
 * })
 * ```
 *
 * @example
 * ```ts
 * // Client-side usage — send session + user ID in headers
 * const userStore = useUserStore()
 * await $fetch('/api/me', {
 *   headers: {
 *     Authorization: `Bearer ${userStore.session?.$id}`,
 *     'x-appwrite-user-id': userStore.user?.$id ?? '',
 *   },
 * })
 * ```
 */
export async function useAppwriteSession(
  event: H3Event,
): Promise<Models.User<Models.Preferences>> {
  const { sessionId, userId } = _extractSessionCredentials(event);

  if (!sessionId || !userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
    });
  }

  const { users } = useAppwriteAdmin();

  // 1. Verify the user exists
  let user: Models.User<Models.Preferences>;
  try {
    user = await users.get({ userId });
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid user",
    });
  }

  // 2. Verify the session is valid and belongs to this user
  try {
    const sessions = await users.listSessions({ userId });
    const validSession = sessions.sessions.find((s) => s.$id === sessionId);

    if (!validSession) {
      throw new Error("Session not found");
    }

    // Check expiry
    const expiry = new Date(validSession.expire).getTime();
    if (expiry < Date.now()) {
      throw new Error("Session expired");
    }
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid or expired session",
    });
  }

  return user;
}

// ─── Config Helpers ──────────────────────────────────────────

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
