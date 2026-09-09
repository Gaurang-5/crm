const { cpSync, mkdirSync } = require('node:fs');
mkdirSync('dist/api/server/src/db/migrations', { recursive: true });
cpSync('server/src/db/migrations', 'dist/api/server/src/db/migrations', { recursive: true });
