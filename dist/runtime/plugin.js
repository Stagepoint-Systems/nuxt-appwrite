import {
  Client,
  Account,
  Databases,
  Storage,
  Functions,
  Messaging,
  Teams,
  Realtime,
  Avatars
} from "appwrite";
import { defineNuxtPlugin, useRuntimeConfig } from "#imports";
const client = new Client();
const services = {
  client,
  account: new Account(client),
  databases: new Databases(client),
  storage: new Storage(client),
  functions: new Functions(client),
  messaging: new Messaging(client),
  teams: new Teams(client),
  realtime: new Realtime(client),
  avatars: new Avatars(client)
};
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const { endpoint, projectId } = config.public.appwrite;
  if (endpoint && projectId) {
    client.setEndpoint(endpoint).setProject(projectId);
  } else {
    console.warn(
      "[nuxt-appwrite] Missing endpoint or projectId in runtime config. Set NUXT_PUBLIC_APPWRITE_ENDPOINT and NUXT_PUBLIC_APPWRITE_PROJECT_ID env variables."
    );
  }
  return {
    provide: {
      appwrite: services
    }
  };
});
