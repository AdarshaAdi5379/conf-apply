import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load the backend .env, even if the server is started from the repo root.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

