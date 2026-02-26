import { defineNuxtModule, createResolver, addPlugin, addImports, addServerImportsDir } from '@nuxt/kit';
import { defu } from 'defu';

const module = defineNuxtModule({
  meta: {
    name: "nuxt-appwrite",
    configKey: "appwrite",
    compatibility: {
      nuxt: ">=3.0.0"
    }
  },
  defaults: {
    endpoint: "",
    projectId: "",
    databaseId: "",
    storageBucketId: "",
    adminTeamId: "",
    apiKey: ""
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    nuxt.options.runtimeConfig.public = defu(
      nuxt.options.runtimeConfig.public,
      {
        appwrite: {
          endpoint: options.endpoint || process.env.NUXT_PUBLIC_APPWRITE_ENDPOINT || "",
          projectId: options.projectId || process.env.NUXT_PUBLIC_APPWRITE_PROJECT_ID || "",
          databaseId: options.databaseId || process.env.NUXT_PUBLIC_APPWRITE_DATABASE_ID || "",
          storageBucketId: options.storageBucketId || process.env.NUXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || "",
          adminTeamId: options.adminTeamId || process.env.NUXT_PUBLIC_APPWRITE_ADMIN_TEAM_ID || ""
        }
      }
    );
    nuxt.options.runtimeConfig = defu(nuxt.options.runtimeConfig, {
      appwrite: {
        apiKey: options.apiKey || process.env.NUXT_APPWRITE_API_KEY || ""
      }
    });
    addPlugin({
      src: resolve("./runtime/plugin"),
      mode: "client"
    });
    addImports({
      name: "useAppwrite",
      as: "useAppwrite",
      from: resolve("./runtime/composables/useAppwrite")
    });
    addServerImportsDir(resolve("./runtime/server/utils"));
  }
});

export { module as default };
