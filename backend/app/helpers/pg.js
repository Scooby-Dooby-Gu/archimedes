import pg from 'pg';

pg.defaults.parseInputDatesAsUTC = true;
pg.types.setTypeParser(1082, function(stringValue) {
  return stringValue;
});
pg.types.setTypeParser(20, function(stringValue) {
  return parseInt(stringValue);
});

export const getPool = () => {
  const sslSettings = process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'qa' ? {
    ssl: {
      rejectUnauthorized: false
    }
  } : {};
  return new pg.Pool(process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ...sslSettings
  } : {
    ...sslSettings
  });
  
}
export const pool = getPool();

export {pg};
