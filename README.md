# nuxt-appwrite

Universal Appwrite connection module for Nuxt. Drop-in auth, database, storage, realtime, and every other Appwrite service — just add env variables and go.

## Quick Start

### 1. Install

```bash
pnpm add github:Stagepoint-Systems/nuxt-appwrite appwrite node-appwrite
```

### 2. Add to `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ["nuxt-appwrite"],

  // Optional: configure inline (env vars also work)
  appwrite: {
    endpoint: "https://nyc.cloud.appwrite.io/v1",
    projectId: "your_project_id",
    databaseId: "your_database_id",
    storageBucketId: "your_bucket_id",
  },
});
```

### 3. Set Environment Variables

```env
# Required
NUXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NUXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id

# Optional
NUXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NUXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_bucket_id
NUXT_PUBLIC_APPWRITE_ADMIN_TEAM_ID=your_admin_team_id
NUXT_APPWRITE_API_KEY=your_server_api_key
```

### 4. Use It

**In Vue components** (auto-imported):

```vue
<script setup>
const { db, auth, storage, DATABASE_ID, query, subscribe } = useAppwrite();

// Quick query
const { documents } = await query("my_collection");

// Full control
const user = await auth.get();

// Realtime
const unsub = subscribe(
  `databases.${DATABASE_ID}.collections.tasks.documents`,
  (event) => console.log("Changed:", event),
);
onUnmounted(() => unsub());
</script>
```

**In server API routes** (auto-imported):

```ts
// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const { users } = useAppwriteAdmin();
  const id = getRouterParam(event, "id");
  return await users.get(id!);
});
```

**JWT authentication in API routes:**

```ts
// server/api/me.get.ts
export default defineEventHandler(async (event) => {
  const jwt = getHeader(event, "Authorization")?.replace("Bearer ", "");
  if (!jwt) throw createError({ statusCode: 401 });

  const { client, account } = useAppwriteJWT();
  client.setJWT(jwt);

  return await account.get();
});
```

## Client Composable API

`useAppwrite()` returns:

| Property            | Type        | Description                  |
| :------------------ | :---------- | :--------------------------- |
| `client`            | `Client`    | Raw Appwrite client          |
| `account` / `auth`  | `Account`   | Auth, sessions, OAuth        |
| `databases` / `db`  | `Databases` | CRUD operations              |
| `storage`           | `Storage`   | File management              |
| `teams`             | `Teams`     | Team memberships             |
| `functions`         | `Functions` | Serverless invocation        |
| `messaging`         | `Messaging` | Push, email, SMS             |
| `realtime`          | `Realtime`  | WebSocket subscriptions      |
| `avatars`           | `Avatars`   | Initials, QR, flags          |
| `DATABASE_ID`       | `string`    | Default database ID from env |
| `STORAGE_BUCKET_ID` | `string`    | Default bucket ID from env   |
| `ADMIN_TEAM_ID`     | `string`    | Admin team ID from env       |

**Helper methods:**

| Method                                                    | Description                |
| :-------------------------------------------------------- | :------------------------- |
| `query(collectionId, queries?, databaseId?)`              | Quick list documents       |
| `getDocument(collectionId, docId, queries?, databaseId?)` | Get single document        |
| `hasRole(teamId, role)`                                   | Check team membership role |
| `getFilePreview(fileId, options?)`                        | Get file preview URL       |
| `getFileDownload(fileId, bucketId?)`                      | Get download URL           |
| `getFileView(fileId, bucketId?)`                          | Get inline view URL        |
| `subscribe(channel, callback)`                            | Realtime subscription      |

## Server Utilities API

| Function                       | Description                                               |
| :----------------------------- | :-------------------------------------------------------- |
| `useAppwriteAdmin()`           | Singleton admin client (requires `NUXT_APPWRITE_API_KEY`) |
| `useAppwriteJWT()`             | Fresh scoped client for JWT auth (call `client.setJWT()`) |
| `useAppwriteDatabaseId()`      | Returns configured database ID                            |
| `useAppwriteStorageBucketId()` | Returns configured bucket ID                              |

## License

MIT
