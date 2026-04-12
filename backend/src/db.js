import postgres from 'postgres';
import dns from 'dns';
import './env.js';

dns.setDefaultResultOrder('ipv4first');

const connectionString = process.env.DATABASE_URL;

const missingDatabaseUrlError = new Error('Missing DATABASE_URL. Set it in backend/.env');

const sql = connectionString
  ? postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      max: 10,
      idle_timeout: 20,
      connect_timeout: 15,
    })
  : new Proxy(() => {
      throw missingDatabaseUrlError;
    }, {
      apply() {
        throw missingDatabaseUrlError;
      },
      get() {
        throw missingDatabaseUrlError;
      },
    });

export default sql;
