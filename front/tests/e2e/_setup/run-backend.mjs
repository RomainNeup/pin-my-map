// Boots an in-memory MongoDB and starts the compiled NestJS backend.
// Used by Playwright's webServer config.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backDir = resolve(__dirname, '../../../../back');

// Resolve mongodb-memory-server from back/node_modules
const requireFromBack = createRequire(resolve(backDir, 'package.json'));
const { MongoMemoryServer } = requireFromBack('mongodb-memory-server');

const mongo = await MongoMemoryServer.create();
const uri = mongo.getUri();

process.env.MONGODB_URI = uri;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.CORS_ALLOWED_ORIGINS =
	process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173';
process.env.PORT = process.env.PORT || '8089';

// eslint-disable-next-line no-console
console.log(`[e2e-backend] Mongo memory server: ${uri}`);

const mainPath = resolve(backDir, 'dist/main.js');
await import(pathToFileURL(mainPath).href);

const shutdown = async () => {
	try {
		await mongo.stop();
	} catch (e) {
		console.error('[e2e-backend] failed to stop mongo', e);
	}
	process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
