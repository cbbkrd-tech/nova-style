import { defineConfig, loadEnv } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV || 'development', process.cwd());

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || 'http://localhost:3000',
      adminCors: process.env.ADMIN_CORS || 'http://localhost:3000',
      authCors: process.env.AUTH_CORS || 'http://localhost:3000',
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  admin: {
    disable: false,
    backendUrl: process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000',
  },
  modules: [
    {
      resolve: '@medusajs/cache-inmemory',
    },
    {
      resolve: '@medusajs/event-bus-local',
    },
    {
      resolve: '@medusajs/workflow-engine-inmemory',
    },
    {
      resolve: '@medusajs/file-local',
      options: {
        upload_dir: 'uploads',
      },
    },
  ],
});
