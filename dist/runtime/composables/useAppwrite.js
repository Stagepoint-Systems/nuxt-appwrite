import { useNuxtApp, useRuntimeConfig } from "#imports";
export const useAppwrite = () => {
  const { $appwrite } = useNuxtApp();
  const config = useRuntimeConfig();
  const appwriteConfig = config.public.appwrite;
  return {
    // ─── Raw Services ─────────────────────────────────────────
    /** The underlying Appwrite Client instance */
    client: $appwrite.client,
    /** Account service — auth, sessions, OAuth, MFA */
    account: $appwrite.account,
    /** Databases service — CRUD operations */
    databases: $appwrite.databases,
    /** Storage service — file uploads, downloads, previews */
    storage: $appwrite.storage,
    /** Functions service — invoke serverless functions */
    functions: $appwrite.functions,
    /** Messaging service — push, email, SMS */
    messaging: $appwrite.messaging,
    /** Teams service — team management, memberships */
    teams: $appwrite.teams,
    /** Realtime service — subscribe to document/collection changes */
    realtime: $appwrite.realtime,
    /** Avatars service — user initials, flags, QR codes */
    avatars: $appwrite.avatars,
    // ─── Convenient Aliases ───────────────────────────────────
    /** Alias for databases */
    db: $appwrite.databases,
    /** Alias for account */
    auth: $appwrite.account,
    // ─── Config Constants ─────────────────────────────────────
    /** The configured database ID from env */
    DATABASE_ID: appwriteConfig.databaseId,
    /** The configured storage bucket ID from env */
    STORAGE_BUCKET_ID: appwriteConfig.storageBucketId,
    /** The configured admin team ID from env */
    ADMIN_TEAM_ID: appwriteConfig.adminTeamId,
    /** The Appwrite endpoint URL */
    ENDPOINT: appwriteConfig.endpoint,
    /** The Appwrite project ID */
    PROJECT_ID: appwriteConfig.projectId,
    // ─── Helper Methods ───────────────────────────────────────
    /**
     * Quick database query helper.
     * Uses the default DATABASE_ID from config.
     *
     * @example
     * ```ts
     * const { query } = useAppwrite()
     * const result = await query('users', [Query.equal('status', 'active')])
     * ```
     */
    async query(collectionId, queries = [], databaseId) {
      return await $appwrite.databases.listDocuments(
        databaseId || appwriteConfig.databaseId,
        collectionId,
        queries
      );
    },
    /**
     * Get a single document by ID.
     * Uses the default DATABASE_ID from config.
     */
    async getDocument(collectionId, documentId, queries = [], databaseId) {
      return await $appwrite.databases.getDocument(
        databaseId || appwriteConfig.databaseId,
        collectionId,
        documentId,
        queries
      );
    },
    /**
     * Check if the current user has a specific role in a team.
     *
     * @example
     * ```ts
     * const { hasRole, ADMIN_TEAM_ID } = useAppwrite()
     * const isAdmin = await hasRole(ADMIN_TEAM_ID, 'owner')
     * ```
     */
    async hasRole(teamId, role) {
      if (import.meta.server) return false;
      try {
        const memberships = await $appwrite.teams.listMemberships(teamId);
        const currentUser = await $appwrite.account.get();
        const membership = memberships.memberships.find(
          (m) => m.userId === currentUser.$id && m.confirm
        );
        return membership?.roles?.includes(role) || false;
      } catch {
        return false;
      }
    },
    /**
     * Get a file preview URL from Appwrite Storage.
     *
     * @example
     * ```ts
     * const { getFilePreview } = useAppwrite()
     * const url = getFilePreview('file_abc123', { width: 200, height: 200 })
     * ```
     */
    getFilePreview(fileId, options = {}) {
      return $appwrite.storage.getFilePreview(
        options.bucketId || appwriteConfig.storageBucketId,
        fileId,
        options.width,
        options.height,
        void 0,
        // gravity
        options.quality
      );
    },
    /**
     * Get a file download URL from Appwrite Storage.
     */
    getFileDownload(fileId, bucketId) {
      return $appwrite.storage.getFileDownload(
        bucketId || appwriteConfig.storageBucketId,
        fileId
      );
    },
    /**
     * Get a file view URL from Appwrite Storage (inline display).
     */
    getFileView(fileId, bucketId) {
      return $appwrite.storage.getFileView(
        bucketId || appwriteConfig.storageBucketId,
        fileId
      );
    },
    /**
     * Subscribe to realtime events on a channel.
     *
     * @example
     * ```ts
     * const { subscribe, DATABASE_ID } = useAppwrite()
     * const unsub = subscribe(
     *   `databases.${DATABASE_ID}.collections.tasks.documents`,
     *   (event) => console.log('Task changed:', event)
     * )
     * // Later: unsub()
     * ```
     */
    subscribe(channel, callback) {
      return $appwrite.realtime.subscribe(channel, callback);
    }
  };
};
