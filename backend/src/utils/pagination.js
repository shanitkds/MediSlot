function parsePagination(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
  };
}

function parseSort(sort, allowed = ["createdAt", "name", "email"]) {
  if (!sort) return { createdAt: -1 };
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  if (!allowed.includes(field)) return { createdAt: -1 };
  return { [field]: desc ? -1 : 1 };
}

/**
 * Builds a MongoDB filter object from query params and options.
 *
 * @param {Object} query - Express req.query
 * @param {Object} [options]
 * @param {Object} [options.baseFilter] - Default conditions (e.g. { isArchive: false })
 * @param {Array<string>} [options.searchFields] - Schema fields to search with regex
 * @param {Array<string>|Object} [options.exactFields] - Query param keys to match exactly, or key-map { queryParam: "schemaField" }
 * @param {Array<string>} [options.booleanFields] - Query param keys to parse as booleans
 * @param {Function} [options.customFilter] - Optional function (filter, query) to apply additional conditions
 * @returns {Object} MongoDB query filter
 */
async function buildFilter(query = {}, options = {}) {
  const {
    baseFilter = {},
    searchFields = [],
    regexFields = [],
    exactFields = [],
    booleanFields = [],
    customFilter,
  } = options;

  const filter = { ...baseFilter };

  // 1. Boolean fields
  for (const field of booleanFields) {
    if (query[field] !== undefined) {
      filter[field] = query[field] === true || query[field] === "true";
    }
  }

  // 2. Exact match fields (handles Array of field names or Object of { queryKey: schemaField })
  if (Array.isArray(exactFields)) {
    for (const field of exactFields) {
      if (query[field] !== undefined && query[field] !== "") {
        filter[field] = query[field];
      }
    }
  } else if (typeof exactFields === "object" && exactFields !== null) {
    for (const [queryKey, schemaField] of Object.entries(exactFields)) {
      if (query[queryKey] !== undefined && query[queryKey] !== "") {
        filter[schemaField] = query[queryKey];
      }
    }
  }

  // 3. Regex fields (field-specific regex match)
  for (const field of regexFields) {
    if (query[field] && typeof query[field] === "string") {
      const escaped = query[field].trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (escaped) {
        filter[field] = { $regex: escaped, $options: "i" };
      }
    }
  }

  // 4. Search query across searchFields
  if (query.search && typeof query.search === "string" && searchFields.length > 0) {
    const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (escaped) {
      const searchConditions = searchFields.map((field) => ({
        [field]: { $regex: escaped, $options: "i" },
      }));

      if (filter.$or) {
        filter.$and = filter.$and || [];
        filter.$and.push({ $or: searchConditions });
      } else {
        filter.$or = searchConditions;
      }
    }
  }

  // 4. Custom filter callback
  if (typeof customFilter === "function") {
    await customFilter(filter, query);
  }

  return filter;
}

/**
 * Common pagination, filtering, and sorting executor for Mongoose models.
 *
 * @param {Model} model - Mongoose model
 * @param {Object} query - Express req.query
 * @param {Object} [options]
 * @param {Object} [options.baseFilter] - Default filter conditions (e.g. { isArchive: false })
 * @param {Array<string>} [options.searchFields] - Fields to regex search when query.search is present
 * @param {Array<string>|Object} [options.exactFields] - Exact match fields or queryKey -> schemaField map
 * @param {Array<string>} [options.booleanFields] - Fields to treat as booleans
 * @param {Array<string>} [options.allowedSort] - Allowed sorting fields
 * @param {string|Array|Object} [options.populate] - Mongoose population
 * @param {string|Object} [options.select] - Mongoose field projection
 * @param {Function} [options.customFilter] - Custom filter modifier function (filter, query)
 * @returns {Promise<{ items: Array, pagination: Object }>}
 */
async function paginate(model, query = {}, options = {}) {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query.sort, options.allowedSort || ["createdAt", "name", "email"]);
  const filter = await buildFilter(query, options);

  let mongooseQuery = model.find(filter).sort(sort).skip(skip).limit(limit);

  if (options.select) {
    mongooseQuery = mongooseQuery.select(options.select);
  }

  if (options.populate) {
    if (Array.isArray(options.populate)) {
      for (const pop of options.populate) {
        mongooseQuery = mongooseQuery.populate(pop);
      }
    } else {
      mongooseQuery = mongooseQuery.populate(options.populate);
    }
  }

  const [items, total] = await Promise.all([
    mongooseQuery.exec(),
    model.countDocuments(filter),
  ]);

  return {
    items,
    pagination: paginationMeta({ page, limit, total }),
  };
}

module.exports = {
  parsePagination,
  paginationMeta,
  parseSort,
  buildFilter,
  paginate,
};
