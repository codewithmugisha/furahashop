import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.poolQueryViaFetch = true;

let sql;

function getSql() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    sql = neon(connectionString);
  }
  return sql;
}

export async function one(strings, ...values) {
  const rows = await getSql()(strings, ...values);
  return rows[0] || null;
}

export async function value(strings, ...values) {
  const rows = await getSql()(strings, ...values);
  if (!rows[0]) return null;
  return Object.values(rows[0])[0];
}

export { getSql as sql };
export default getSql;
