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

## Usage Examples

### Authentication

**OAuth Login (Google, GitHub, etc.):**

```vue
<script setup>
const { auth } = useAppwrite();

function loginWithGoogle() {
  auth.createOAuth2Session(
    "google",
    "http://localhost:3000/auth/callback", // success redirect
    "http://localhost:3000/auth/failure", // failure redirect
  );
}
</script>

<template>
  <button @click="loginWithGoogle">Sign in with Google</button>
</template>
```

**Email/Password Signup & Login:**

```ts
const { auth } = useAppwrite();

// Sign up
await auth.create("unique()", "user@example.com", "password123", "John Doe");

// Log in (creates a session)
await auth.createEmailPasswordSession("user@example.com", "password123");

// Get current user
const user = await auth.get();

// Log out (current session)
await auth.deleteSession("current");
```

**Check if logged in:**

```vue
<script setup>
const { auth } = useAppwrite();

const user = ref(null);

onMounted(async () => {
  try {
    user.value = await auth.get();
  } catch {
    // Not logged in
  }
});
</script>
```

---

### Database

**Create a document:**

```ts
const { db, DATABASE_ID } = useAppwrite();
import { ID, Permission, Role } from "appwrite";

await db.createDocument(DATABASE_ID, "posts", ID.unique(), {
  title: "Hello World",
  content: "My first post",
  published: true,
});
```

**Update a document:**

```ts
const { db, DATABASE_ID } = useAppwrite();

await db.updateDocument(DATABASE_ID, "posts", "document_id_here", {
  title: "Updated Title",
});
```

**Delete a document:**

```ts
const { db, DATABASE_ID } = useAppwrite();

await db.deleteDocument(DATABASE_ID, "posts", "document_id_here");
```

**Query with filters:**

```ts
const { query } = useAppwrite();
import { Query } from "appwrite";

// All published posts, newest first, limit 10
const { documents } = await query("posts", [
  Query.equal("published", true),
  Query.orderDesc("$createdAt"),
  Query.limit(10),
]);

// Search by text
const { documents: results } = await query("posts", [
  Query.search("title", "hello"),
]);

// Pagination
const { documents: page2 } = await query("posts", [
  Query.limit(10),
  Query.offset(10),
]);
```

**Get a single document:**

```ts
const { getDocument } = useAppwrite();

const post = await getDocument("posts", "document_id_here");
```

---

### File Storage

**Upload a file:**

```vue
<script setup>
const { storage, STORAGE_BUCKET_ID } = useAppwrite();
import { ID } from "appwrite";

async function uploadFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const result = await storage.createFile(STORAGE_BUCKET_ID, ID.unique(), file);
  console.log("Uploaded:", result.$id);
}
</script>

<template>
  <input type="file" @change="uploadFile" />
</template>
```

**Get file preview / download URLs:**

```ts
const { getFilePreview, getFileDownload } = useAppwrite();

// Resized preview
const previewUrl = getFilePreview("file_id", {
  width: 400,
  height: 300,
  quality: 80,
});

// Direct download
const downloadUrl = getFileDownload("file_id");
```

---

### Realtime Subscriptions

```vue
<script setup>
const { subscribe, DATABASE_ID } = useAppwrite();

// Subscribe to all changes in a collection
const unsub = subscribe(
  `databases.${DATABASE_ID}.collections.messages.documents`,
  (event) => {
    console.log("Event:", event.events);
    console.log("Payload:", event.payload);
  },
);

// Subscribe to a specific document
const unsub2 = subscribe(
  `databases.${DATABASE_ID}.collections.messages.documents.doc123`,
  (event) => console.log("Doc changed:", event.payload),
);

onUnmounted(() => {
  unsub();
  unsub2();
});
</script>
```

---

### Teams & Roles

```ts
const { teams, hasRole, ADMIN_TEAM_ID } = useAppwrite();

// Check if user is an admin
const isAdmin = await hasRole(ADMIN_TEAM_ID, "owner");

// List team members
const members = await teams.listMemberships("team_id");
```

---

### Server-Side (API Routes)

**Create a document with admin permissions:**

```ts
// server/api/posts.post.ts
import { ID, Permission, Role } from "node-appwrite";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { databases } = useAppwriteAdmin();
  const dbId = useAppwriteDatabaseId();

  return await databases.createDocument(dbId, "posts", ID.unique(), body, [
    Permission.read(Role.any()),
    Permission.write(Role.user(body.userId)),
  ]);
});
```

**Authenticate a request via JWT:**

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

**List users (admin only):**

```ts
// server/api/admin/users.get.ts
export default defineEventHandler(async () => {
  const { users } = useAppwriteAdmin();
  return await users.list();
});
```

---

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
