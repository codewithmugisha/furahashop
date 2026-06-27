import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.poolQueryViaFetch = true;
neonConfig.fetchFunction = globalThis.fetch;

let sql;

function getSql() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    console.log('Neon: initializing SQL client');
    sql = neon(connectionString);
  }
  return sql;
}

function q(name) {
  return `"${name}"`;
}

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function toParamIdx(idx) {
  return `$${idx}`;
}

function buildWhere(where, state) {
  if (!where || Object.keys(where).length === 0) return { clause: '', params: [] };
  const parts = [];
  const params = [];
  if (!state) state = {};
  if (state.idx === undefined) state.idx = 0;
  const modelName = state.modelName;

  for (const [key, val] of Object.entries(where)) {
    if (key === 'AND' && Array.isArray(val)) {
      const sub = val.map(v => buildWhere(v, state));
      parts.push(`(${sub.map(s => s.clause).join(' AND ')})`);
      for (const s of sub) { params.push(...s.params); }
      continue;
    }
    if (key === 'OR' && Array.isArray(val)) {
      const sub = val.map(v => buildWhere(v, state));
      parts.push(`(${sub.map(s => s.clause).join(' OR ')})`);
      for (const s of sub) { params.push(...s.params); }
      continue;
    }
    if (key === 'NOT' && typeof val === 'object') {
      const sub = buildWhere(val, state);
      parts.push(`NOT (${sub.clause})`);
      params.push(...sub.params);
      continue;
    }

    const rel = modelName && RELATION_MAP[modelName] && RELATION_MAP[modelName][key];
    if (rel && typeof val === 'object' && !(val instanceof Date) && !Array.isArray(val)) {
      const ops = Object.keys(val);
      if (ops.length === 1 && ['none', 'some', 'every'].includes(ops[0])) {
        const op = ops[0];
        const opVal = val[op];
        const subModelName = rel.table;
        let subWhere = null;
        if (opVal && typeof opVal === 'object' && Object.keys(opVal).length > 0) {
          subWhere = buildWhere(opVal, { ...state, modelName: subModelName });
        }
        const subClause = subWhere ? ` AND ${subWhere.clause}` : '';
        const subWhereParams = subWhere ? subWhere.params : [];

        if (op === 'none') {
          parts.push(`NOT EXISTS (SELECT 1 FROM ${q(rel.table)} WHERE ${q(rel.table)}.${q(rel.foreignKey)} = ${q(modelName)}.id${subClause})`);
          params.push(...subWhereParams);
        } else if (op === 'some') {
          parts.push(`EXISTS (SELECT 1 FROM ${q(rel.table)} WHERE ${q(rel.table)}.${q(rel.foreignKey)} = ${q(modelName)}.id${subClause})`);
          params.push(...subWhereParams);
        } else if (op === 'every') {
          if (subWhere) {
            parts.push(`NOT EXISTS (SELECT 1 FROM ${q(rel.table)} WHERE ${q(rel.table)}.${q(rel.foreignKey)} = ${q(modelName)}.id AND NOT (${subWhere.clause}))`);
            params.push(...subWhereParams);
          } else {
            parts.push(`NOT EXISTS (SELECT 1 FROM ${q(rel.table)} WHERE ${q(rel.table)}.${q(rel.foreignKey)} = ${q(modelName)}.id)`);
          }
        }
        continue;
      }
    }

    const col = q(key);
    if (val === null) {
      parts.push(`${col} IS NULL`);
    } else if (typeof val === 'object' && !(val instanceof Date)) {
      for (const [op, opVal] of Object.entries(val)) {
        state.idx++;
        switch (op) {
          case 'equals':
            parts.push(`${col} = ${toParamIdx(state.idx)}`);
            params.push(opVal);
            break;
          case 'not':
            if (opVal === null) {
              parts.push(`${col} IS NOT NULL`);
            } else {
              parts.push(`${col} != ${toParamIdx(state.idx)}`);
              params.push(opVal);
            }
            break;
          case 'in':
            if (Array.isArray(opVal) && opVal.length === 0) {
              parts.push('1=0');
            } else {
              const phs = opVal.map((_, i) => { state.idx++; return toParamIdx(state.idx); });
              parts.push(`${col} IN (${phs.join(', ')})`);
              params.push(...opVal);
            }
            break;
          case 'notIn':
            if (Array.isArray(opVal) && opVal.length === 0) {
              // no-op
            } else {
              const phs = opVal.map((_, i) => { state.idx++; return toParamIdx(state.idx); });
              parts.push(`${col} NOT IN (${phs.join(', ')})`);
              params.push(...opVal);
            }
            break;
          case 'lt':
            parts.push(`${col} < ${toParamIdx(state.idx)}`);
            params.push(opVal);
            break;
          case 'lte':
            parts.push(`${col} <= ${toParamIdx(state.idx)}`);
            params.push(opVal);
            break;
          case 'gt':
            parts.push(`${col} > ${toParamIdx(state.idx)}`);
            params.push(opVal);
            break;
          case 'gte':
            parts.push(`${col} >= ${toParamIdx(state.idx)}`);
            params.push(opVal);
            break;
          case 'contains':
            parts.push(`${col}::text LIKE ${toParamIdx(state.idx)}`);
            params.push(`%${opVal}%`);
            break;
          case 'startsWith':
            parts.push(`${col}::text LIKE ${toParamIdx(state.idx)}`);
            params.push(`${opVal}%`);
            break;
          case 'endsWith':
            parts.push(`${col}::text LIKE ${toParamIdx(state.idx)}`);
            params.push(`%${opVal}`);
            break;
          default:
            parts.push(`${col} = ${toParamIdx(state.idx)}`);
            params.push(opVal);
        }
      }
    } else {
      state.idx++;
      parts.push(`${col} = ${toParamIdx(state.idx)}`);
      params.push(val);
    }
  }

  return { clause: parts.join(' AND '), params };
}

function buildOrderBy(orderBy) {
  if (!orderBy) return '';
  if (typeof orderBy === 'string') {
    return `ORDER BY ${q(orderBy)} ASC`;
  }
  if (Array.isArray(orderBy)) {
    const parts = orderBy.map(o => {
      const [key, dir] = Object.entries(o)[0];
      return `${q(key)} ${dir === 'desc' ? 'DESC' : 'ASC'}`;
    });
    return `ORDER BY ${parts.join(', ')}`;
  }
  const [key, dir] = Object.entries(orderBy)[0];
  return `ORDER BY ${q(key)} ${dir === 'desc' ? 'DESC' : 'ASC'}`;
}

function buildSelect(include, modelName) {
  if (!include || Object.keys(include).length === 0) {
    return `${q(modelName)}.*`;
  }

  let hasSelect = false;
  for (const [key, val] of Object.entries(include)) {
    if (val && typeof val === 'object' && val.select) {
      hasSelect = true;
      break;
    }
  }

  if (hasSelect) {
    const fields = new Set();
    for (const [key, val] of Object.entries(include)) {
      if (val && typeof val === 'object' && val.select) {
        continue;
      }
      fields.add(`${q(modelName)}.${q(key)}`);
    }
    if (fields.size === 0) fields.add(`${q(modelName)}.*`);
    return [...fields].join(', ');
  }

  return `${q(modelName)}.*`;
}

async function executeQuery(text, params) {
  try {
    return await getSql()(text, params);
  } catch (err) {
    console.error(`SQL Error: ${text.slice(0, 200)}`, err.message);
    throw err;
  }
}

async function fetchIncludes(row, include, parentTable, parentKey = 'id') {
  if (!row || !include) return row;

  for (const [relName, relOpts] of Object.entries(include)) {
    const relOptsObj = relOpts || {};
    const foreignKey = relOpts === true ? `${parentTable.slice(0, -1)}Id` : null;

    if (relOpts === true || (typeof relOpts === 'object' && !relOpts.through)) {
      row[relName] = row[relName] || null;
    }

    if (typeof relOpts === 'object' && relOpts.through) {
      continue;
    }
  }

  return row;
}

const RELATION_MAP = {
  Product: {
    images: { table: 'ProductImage', foreignKey: 'productId', isArray: true },
    productType: { table: 'ProductType', foreignKey: 'productTypeId', isArray: false },
    priceTier: { table: 'PriceTier', foreignKey: 'priceTierId', isArray: false },
    storeOrders: { table: 'StoreOrder', foreignKey: 'productId', isArray: true },
    productLikes: { table: 'ProductLike', foreignKey: 'productId', isArray: true },
    productViews: { table: 'ProductView', foreignKey: 'productId', isArray: true },
  },
  StoreOrder: {
    product: { table: 'Product', foreignKey: 'productId', isArray: false },
    storeClient: { table: 'StoreClient', foreignKey: 'storeClientId', isArray: false },
  },
  ProductType: {
    products: { table: 'Product', foreignKey: 'productTypeId', isArray: true },
  },
  PriceTier: {
    products: { table: 'Product', foreignKey: 'priceTierId', isArray: true },
  },
  Owner: {
    workshop: { table: 'Workshop', foreignKey: 'ownerId', isArray: false },
  },
  Client: {
    jobs: { table: 'Job', foreignKey: 'clientId', isArray: true },
  },
  StoreClient: {
    orders: { table: 'StoreOrder', foreignKey: 'storeClientId', isArray: true },
    otps: { table: 'ClientOTP', foreignKey: 'clientId', isArray: true },
    session: { table: 'ClientSession', foreignKey: 'clientId', isArray: false },
    preference: { table: 'ClientPreference', foreignKey: 'clientId', isArray: false },
    productViews: { table: 'ProductView', foreignKey: 'clientId', isArray: true },
    productLikes: { table: 'ProductLike', foreignKey: 'clientId', isArray: true },
  },
  ClientSession: {
    client: { table: 'StoreClient', foreignKey: 'clientId', isArray: false },
  },
  ClientOTP: {
    client: { table: 'StoreClient', foreignKey: 'clientId', isArray: false },
  },
  ProductImage: {
    product: { table: 'Product', foreignKey: 'productId', isArray: false },
  },
};

async function resolveInclude(row, modelName, include) {
  if (!row || !include) return row;

  const rels = RELATION_MAP[modelName] || {};
  const result = { ...row };

  for (const [relName, relOpts] of Object.entries(include)) {
    if (relName === '_count' && relOpts) {
      if (!result._count) result._count = {};
      const select = relOpts.select || relOpts;
      for (const [countRel, countOpts] of Object.entries(select)) {
        const rel = rels[countRel];
        if (!rel || !rel.isArray) continue;
        let countWhere = { [rel.foreignKey]: row.id };
        if (countOpts && countOpts.where) {
          countWhere = { AND: [countWhere, countOpts.where] };
        }
        result._count[countRel] = await countInternal(rel.table, { where: countWhere });
      }
      continue;
    }

    const rel = rels[relName];
    if (!rel) continue;

    const relatedFKValue = row[rel.foreignKey];
    if (!relatedFKValue && !rel.isArray) {
      result[relName] = null;
      continue;
    }

    let subWhere = {};
    if (rel.isArray) {
      subWhere[rel.foreignKey] = row.id;
    } else {
      if (!relatedFKValue) {
        result[relName] = null;
        continue;
      }
      subWhere = { id: relatedFKValue };
    }

    const subIncludeOpts = typeof relOpts === 'object' && relOpts !== null ? relOpts : {};

    let subInclude = null;
    let subSelect = null;
    let subOrderBy = null;
    let subTake = null;
    let subSkip = null;

    if (subIncludeOpts.select) {
      subSelect = subIncludeOpts.select;
    }
    if (subIncludeOpts.include) {
      subInclude = subIncludeOpts.include;
    }
    if (subIncludeOpts.orderBy) {
      subOrderBy = subIncludeOpts.orderBy;
    }
    if (subIncludeOpts.take) {
      subTake = subIncludeOpts.take;
    }
    if (subIncludeOpts.skip) {
      subSkip = subIncludeOpts.skip;
    }

    if (rel.isArray) {
      result[relName] = await findManyInternal(rel.table, {
        where: subWhere,
        orderBy: subOrderBy,
        take: subTake,
        skip: subSkip,
        include: subInclude,
        select: subSelect,
      });
    } else {
      result[relName] = await findUniqueInternal(rel.table, {
        where: subWhere,
        include: subInclude,
        select: subSelect,
      });
    }
  }

  return result;
}

async function findUniqueInternal(modelName, args) {
  const { where, include, select } = args || {};
  const { clause, params } = buildWhere(where, { modelName });
  const whereClause = clause ? `WHERE ${clause}` : '';

  const selectClause = select
    ? Object.keys(select).map(k => `${q(modelName)}.${q(k)}`).join(', ')
    : `${q(modelName)}.*`;

  const text = `SELECT ${selectClause} FROM ${q(modelName)} ${whereClause} LIMIT 1`;
  const rows = await executeQuery(text, params);
  if (!rows[0]) return null;

  let row = rows[0];
  if (include) {
    row = await resolveInclude(row, modelName, include);
  }
  if (select && include) {
    row = await resolveInclude(row, modelName, include);
  }
  return row;
}

async function findFirstInternal(modelName, args) {
  const { where, include, orderBy, select } = args || {};
  const { clause, params } = buildWhere(where, { modelName });
  const whereClause = clause ? `WHERE ${clause}` : '';
  const orderClause = buildOrderBy(orderBy);

  const selectClause = select
    ? Object.keys(select).map(k => `${q(modelName)}.${q(k)}`).join(', ')
    : `${q(modelName)}.*`;

  const text = `SELECT ${selectClause} FROM ${q(modelName)} ${whereClause} ${orderClause} LIMIT 1`;
  const rows = await executeQuery(text, params);
  if (!rows[0]) return null;

  let row = rows[0];
  if (include) {
    row = await resolveInclude(row, modelName, include);
  }
  return row;
}

async function findManyInternal(modelName, args) {
  const { where, include, orderBy, skip, take, select } = args || {};
  const { clause, params } = buildWhere(where, { modelName });
  const whereClause = clause ? `WHERE ${clause}` : '';
  const orderClause = buildOrderBy(orderBy);
  const limitClause = take ? `LIMIT ${take}` : '';
  const offsetClause = skip ? `OFFSET ${skip}` : '';

  const selectClause = select
    ? Object.keys(select).map(k => `${q(modelName)}.${q(k)}`).join(', ')
    : `${q(modelName)}.*`;

  const text = `SELECT ${selectClause} FROM ${q(modelName)} ${whereClause} ${orderClause} ${limitClause} ${offsetClause}`;
  const rows = await executeQuery(text, params);

  if (!include) return rows;

  const result = [];
  for (const row of rows) {
    result.push(await resolveInclude(row, modelName, include));
  }
  return result;
}

async function countInternal(modelName, args) {
  const { where } = args || {};
  const { clause, params } = buildWhere(where, { modelName });
  const whereClause = clause ? `WHERE ${clause}` : '';

  const text = `SELECT COUNT(*)::int AS cnt FROM ${q(modelName)} ${whereClause}`;
  const rows = await executeQuery(text, params);
  return parseInt(rows[0]?.cnt || 0, 10);
}

function generateId() {
  const ts = Date.now().toString(36);
  const rand = crypto.randomUUID().replace(/-/g, '').slice(0, 17);
  return `c${ts}${rand}`;
}

async function createInternal(modelName, args) {
  const { data } = args || {};
  if (!data || Object.keys(data).length === 0) {
    throw new Error('No data provided for create');
  }

  const enriched = { ...data };
  if (!enriched.id) {
    enriched.id = generateId();
  }

  const keys = Object.keys(enriched);
  const values = keys.map(k => enriched[k]);
  const cols = keys.map(k => q(k)).join(', ');
  const phs = values.map((_, i) => toParamIdx(i + 1)).join(', ');

  const text = `INSERT INTO ${q(modelName)} (${cols}) VALUES (${phs}) RETURNING *`;
  const rows = await executeQuery(text, values);
  return rows[0] || null;
}

async function updateInternal(modelName, args) {
  const { where, data } = args || {};
  if (!data || Object.keys(data).length === 0) {
    throw new Error('No data provided for update');
  }

  const setClauses = [];
  const params = [];
  let idx = 0;

  for (const [key, val] of Object.entries(data)) {
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      const keys = Object.keys(val);
      if (keys.length === 1 && ['increment', 'decrement', 'set'].includes(keys[0])) {
        const op = keys[0];
        const opVal = val[op];
        if (op === 'increment') {
          idx++;
          setClauses.push(`${q(key)} = ${q(key)} + ${toParamIdx(idx)}`);
          params.push(opVal);
        } else if (op === 'decrement') {
          idx++;
          setClauses.push(`${q(key)} = ${q(key)} - ${toParamIdx(idx)}`);
          params.push(opVal);
        } else if (op === 'set') {
          idx++;
          setClauses.push(`${q(key)} = ${toParamIdx(idx)}`);
          params.push(opVal);
        }
      } else {
        idx++;
        setClauses.push(`${q(key)} = ${toParamIdx(idx)}`);
        params.push(val);
      }
    } else {
      idx++;
      setClauses.push(`${q(key)} = ${toParamIdx(idx)}`);
      params.push(val);
    }
  }

  const state = { idx, modelName };
  const { clause: whereClause, params: whereParams } = buildWhere(where, state);
  const whereStr = whereClause ? `WHERE ${whereClause}` : '';

  const text = `UPDATE ${q(modelName)} SET ${setClauses.join(', ')} ${whereStr} RETURNING *`;
  const rows = await executeQuery(text, [...params, ...whereParams]);
  return rows[0] || null;
}

async function updateManyInternal(modelName, args) {
  const { where, data } = args || {};
  const setClauses = [];
  const params = [];
  let idx = 0;

  for (const [key, val] of Object.entries(data)) {
    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
      const keys = Object.keys(val);
      if (keys.length === 1 && keys[0] === 'increment') {
        idx++;
        setClauses.push(`${q(key)} = ${q(key)} + ${toParamIdx(idx)}`);
        params.push(val.increment);
      } else if (keys.length === 1 && keys[0] === 'decrement') {
        idx++;
        setClauses.push(`${q(key)} = ${q(key)} - ${toParamIdx(idx)}`);
        params.push(val.decrement);
      } else {
        idx++;
        setClauses.push(`${q(key)} = ${toParamIdx(idx)}`);
        params.push(val);
      }
    } else {
      idx++;
      setClauses.push(`${q(key)} = ${toParamIdx(idx)}`);
      params.push(val);
    }
  }

  const state = { idx, modelName };
  const { clause: whereClause, params: whereParams } = buildWhere(where, state);
  const whereStr = whereClause ? `WHERE ${whereClause}` : '';

  const text = `UPDATE ${q(modelName)} SET ${setClauses.join(', ')} ${whereStr}`;
  await executeQuery(text, [...params, ...whereParams]);
  return { count: 0 };
}

async function upsertInternal(modelName, args) {
  const { where, create, update } = args || {};
  const { clause, params: whereParams } = buildWhere(where, { modelName });

  if (!clause) throw new Error('WHERE clause required for upsert');

  const existing = await findUniqueInternal(modelName, { where });
  if (existing) {
    return updateInternal(modelName, { where, data: update });
  }
  return createInternal(modelName, { data: create });
}

async function deleteInternal(modelName, args) {
  const { where } = args || {};
  const { clause, params } = buildWhere(where, { modelName });
  const whereStr = clause ? `WHERE ${clause}` : '';

  const text = `DELETE FROM ${q(modelName)} ${whereStr} RETURNING *`;
  const rows = await executeQuery(text, params);
  return rows[0] || null;
}

function buildGroupByOrderBy(orderBy) {
  if (!orderBy) return '';
  if (typeof orderBy === 'string') {
    return `ORDER BY ${q(orderBy)} ASC`;
  }
  const parts = [];
  const list = Array.isArray(orderBy) ? orderBy : [orderBy];
  for (const item of list) {
    const [key, val] = Object.entries(item)[0];
    let dir = 'ASC';
    let col = q(key);
    if (typeof val === 'string') {
      dir = val.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    } else if (typeof val === 'object') {
      const [subKey, subVal] = Object.entries(val)[0];
      dir = subVal === 'desc' ? 'DESC' : 'ASC';
      if (key === '_count') col = `cnt_${subKey}`;
      else if (key === '_sum') col = `sum_${subKey}`;
      else if (key === '_max') col = `max_${subKey}`;
      else if (key === '_min') col = `min_${subKey}`;
      else if (key === '_avg') col = `avg_${subKey}`;
    }
    parts.push(`${col} ${dir}`);
  }
  return `ORDER BY ${parts.join(', ')}`;
}

async function groupByInternal(modelName, args) {
  const { by, where, _count, _sum, _max, _min, _avg, orderBy, skip, take } = args || {};
  const { clause, params } = buildWhere(where, { modelName });
  const whereStr = clause ? `WHERE ${clause}` : '';

  const byCols = by.map(k => q(k)).join(', ');
  const selects = [byCols];

  const countFields = [];
  if (_count) {
    if (_count === true) {
      selects.push(`COUNT(*)::int AS cnt`);
    } else {
      for (const field of Object.keys(_count)) {
        selects.push(`COUNT(${q(field)})::int AS cnt_${field}`);
        countFields.push(field);
      }
    }
  }

  const sumFields = [];
  if (_sum) {
    for (const [field, val] of Object.entries(_sum)) {
      if (val === true) {
        selects.push(`COALESCE(SUM(${q(field)}), 0) AS sum_${field}`);
        sumFields.push(field);
      }
    }
  }

  const maxFields = [];
  if (_max) {
    for (const [field, val] of Object.entries(_max)) {
      if (val === true) {
        selects.push(`MAX(${q(field)}) AS max_${field}`);
        maxFields.push(field);
      }
    }
  }

  const minFields = [];
  if (_min) {
    for (const [field, val] of Object.entries(_min)) {
      if (val === true) {
        selects.push(`MIN(${q(field)}) AS min_${field}`);
        minFields.push(field);
      }
    }
  }

  const avgFields = [];
  if (_avg) {
    for (const [field, val] of Object.entries(_avg)) {
      if (val === true) {
        selects.push(`AVG(${q(field)})::float AS avg_${field}`);
        avgFields.push(field);
      }
    }
  }

  const orderClause = buildGroupByOrderBy(orderBy);
  const limitClause = take ? `LIMIT ${take}` : '';
  const offsetClause = skip ? `OFFSET ${skip}` : '';

  const text = `SELECT ${selects.join(', ')} FROM ${q(modelName)} ${whereStr} GROUP BY ${byCols} ${orderClause} ${limitClause} ${offsetClause}`;
  const rows = await executeQuery(text, params);

  return rows.map(row => {
    const result = { ...row };
    for (const field of countFields) {
      if (!result._count) result._count = {};
      result._count[field] = result[`cnt_${field}`];
      delete result[`cnt_${field}`];
    }
    for (const field of sumFields) {
      if (!result._sum) result._sum = {};
      result._sum[field] = result[`sum_${field}`];
      delete result[`sum_${field}`];
    }
    for (const field of maxFields) {
      if (!result._max) result._max = {};
      result._max[field] = result[`max_${field}`];
      delete result[`max_${field}`];
    }
    for (const field of minFields) {
      if (!result._min) result._min = {};
      result._min[field] = result[`min_${field}`];
      delete result[`min_${field}`];
    }
    for (const field of avgFields) {
      if (!result._avg) result._avg = {};
      result._avg[field] = result[`avg_${field}`];
      delete result[`avg_${field}`];
    }
    return result;
  });
}

async function aggregateInternal(modelName, args) {
  const { where, _sum, _count } = args || {};
  const { clause, params } = buildWhere(where, { modelName });
  const whereStr = clause ? `WHERE ${clause}` : '';

  const selects = [];

  if (_sum) {
    for (const [field, val] of Object.entries(_sum)) {
      if (val === true) {
        selects.push(`COALESCE(SUM(${q(field)}), 0) AS sum_${field}`);
      }
    }
  }

  if (_count) {
    if (_count === true) {
      selects.push(`COUNT(*)::int AS cnt`);
    }
  }

  const text = `SELECT ${selects.join(', ')} FROM ${q(modelName)} ${whereStr}`;
  const rows = await executeQuery(text, params);
  return rows[0] || {};
}

class PrismaModel {
  constructor(name) {
    this._name = name;
  }

  findUnique(args) { return findUniqueInternal(this._name, args); }
  findFirst(args) { return findFirstInternal(this._name, args); }
  findMany(args) { return findManyInternal(this._name, args); }
  count(args) { return countInternal(this._name, args); }
  create(args) { return createInternal(this._name, args); }
  update(args) { return updateInternal(this._name, args); }
  upsert(args) { return upsertInternal(this._name, args); }
  delete(args) { return deleteInternal(this._name, args); }
  updateMany(args) { return updateManyInternal(this._name, args); }
  groupBy(args) { return groupByInternal(this._name, args); }
  aggregate(args) { return aggregateInternal(this._name, args); }
}

const MODELS = [
  'Product', 'ProductType', 'PriceTier', 'ProductImage',
  'StoreOrder', 'StoreClient', 'ClientOTP', 'ClientSession',
  'ProductView', 'ProductLike', 'ClientPreference',
  'Owner', 'Workshop', 'Worker', 'Client', 'Job',
  'AdvanceRequest', 'LunchRequest', 'AbsenceLog',
  'MaterialRequest', 'Invoice', 'PayrollRecord',
  'ActivityLog', 'WorkshopGallery', 'WorkshopService',
  'AgentConversation', 'AgentMessage',
];

const prisma = {};

for (const name of MODELS) {
  const key = name[0].toLowerCase() + name.slice(1);
  prisma[key] = new PrismaModel(name);
}

prisma.$transaction = async (args) => {
  const results = [];
  for (const fn of args) {
    results.push(await fn(prisma));
  }
  return results;
};

prisma.$disconnect = async () => {};

export default prisma;
