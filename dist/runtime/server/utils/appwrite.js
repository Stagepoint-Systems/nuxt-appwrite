import {
  Client,
  Databases,
  Users,
  Teams,
  Storage,
  Account,
  Messaging,
  Functions
} from "node-appwrite";
import { getHeader, parseCookies, createError } from "h3";
import { useRuntimeConfig } from "#imports";
let _adminClient = null;
function _createAdminClient() {
  const config = useRuntimeConfig();
  const { endpoint, projectId } = config.public.appwrite;
  const { apiKey } = config.appwrite;
  if (!endpoint || !projectId) {
    throw new Error(
      "[nuxt-appwrite] Server: Missing endpoint or projectId. Set NUXT_PUBLIC_APPWRITE_ENDPOINT and NUXT_PUBLIC_APPWRITE_PROJECT_ID."
    );
  }
  if (!apiKey) {
    throw new Error(
      "[nuxt-appwrite] Server: Missing API key. Set NUXT_APPWRITE_API_KEY to enable admin operations."
    );
  }
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    users: new Users(client),
    teams: new Teams(client),
    storage: new Storage(client),
    messaging: new Messaging(client),
    functions: new Functions(client)
  };
}
export function useAppwriteAdmin() {
  if (!_adminClient) {
    _adminClient = _createAdminClient();
  }
  return _adminClient;
}
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
    functions: new Functions(client)
  };
}
function _extractSessionCredentials(event) {
  const config = useRuntimeConfig();
  let sessionId = null;
  const authHeader = getHeader(event, "Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    sessionId = authHeader.slice(7);
  }
  if (!sessionId) {
    sessionId = getHeader(event, "x-appwrite-session") ?? null;
  }
  if (!sessionId) {
    const cookies = parseCookies(event);
    const projectId = config.public.appwrite.projectId;
    if (projectId) {
      sessionId = cookies[`a_session_${projectId}`] ?? cookies[`a_session_${projectId}_legacy`] ?? null;
    }
  }
  const userId = getHeader(event, "x-appwrite-user-id") ?? null;
  return { sessionId, userId };
}
export async function useAppwriteSession(event) {
  const { sessionId, userId } = _extractSessionCredentials(event);
  if (!sessionId || !userId) {
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required"
    });
  }
  const { users } = useAppwriteAdmin();
  let user;
  try {
    user = await users.get({ userId });
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid user"
    });
  }
  try {
    const sessions = await users.listSessions({ userId });
    const validSession = sessions.sessions.find((s) => s.$id === sessionId);
    if (!validSession) {
      throw new Error("Session not found");
    }
    const expiry = new Date(validSession.expire).getTime();
    if (expiry < Date.now()) {
      throw new Error("Session expired");
    }
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid or expired session"
    });
  }
  return user;
}
export function useAppwriteDatabaseId() {
  const config = useRuntimeConfig();
  return config.public.appwrite.databaseId;
}
export function useAppwriteStorageBucketId() {
  const config = useRuntimeConfig();
  return config.public.appwrite.storageBucketId;
}
