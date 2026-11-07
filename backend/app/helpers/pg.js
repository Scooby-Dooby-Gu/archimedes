import pg from 'pg';

pg.defaults.parseInputDatesAsUTC = true;
pg.types.setTypeParser(1082, function(stringValue) {
  return stringValue;
});
pg.types.setTypeParser(20, function(stringValue) {
  return parseInt(stringValue);
});

export const getPool = () => {
  const url = process.env.DATABASE_URL || '';
  const localDatabase = !url || /\/\/(?:[^@\/]*@)?(localhost|127\.0\.0\.1)(?::\d+)?\//.test(url) || /sslmode=disable/.test(url);
  const sslSettings = process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'qa' && !localDatabase ? {
    ssl: {
      rejectUnauthorized: false
    }
  } : {};
  // Serverless instances each get their own pool, so keep it small there and
  // point DATABASE_URL at a pooled endpoint (e.g. Neon's "-pooler" host).
  const poolSettings = {
    max: parseInt(process.env.PG_POOL_MAX) || (process.env.VERCEL ? 3 : 10),
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  };
  return new pg.Pool(process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ...poolSettings,
    ...sslSettings
  } : {
    ...poolSettings,
    ...sslSettings
  });
  
}
export const pool = getPool();

export {pg};
