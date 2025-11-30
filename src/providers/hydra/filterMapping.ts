import type { CrudFilters, CrudSorting } from "@refinedev/core";

/**
 * Configuration for sentinel values that represent "no upper limit"
 * When a filter reaches these values, we don't send an upper bound to the API
 */
const SENTINEL_VALUES = {
  adults: 30,
  children: 13,
  babies: 6,
  pets: 3,
  person: 40,
  price: 50000,    // "50k+" means no upper limit
  duration: 49,
  flexibility: 35
} as const;

/**
 * Check if a field should use date-specific API parameters
 */
const isDateField = (field: string): boolean => {
  return ['dateEnquiry', 'arrival', 'departure'].includes(field);
};

/**
 * Map individual filter operator to API parameters
 */
const mapFilterOperator = (field: string, operator: string, value: any, params: Record<string, any>) => {
  switch (operator) {
    case "eq":
      params[field] = value;
      break;

    case "ne":
      params[`${field}[not]`] = value;
      break;

    case "lt":
      if (isDateField(field)) {
        params[`${field}[before]`] = value;
      } else {
        params[`${field}[lt]`] = value;
      }
      break;

    case "gt":
      if (isDateField(field)) {
        params[`${field}[after]`] = value;
      } else {
        params[`${field}[gt]`] = value;
      }
      break;

    case "gte":
      if (isDateField(field)) {
        params[`${field}[after]`] = value;
      } else {
        params[`${field}[gte]`] = value;
      }
      break;

    case "lte":
      if (isDateField(field)) {
        params[`${field}[before]`] = value;
      } else {
        params[`${field}[lte]`] = value;
      }
      break;

    case "in":
      if (field === 'tags') {
        // For tags, use the tags[] parameter format for multiple values
        if (Array.isArray(value)) {
          value.forEach(v => {
            if (!params[`${field}[]`]) params[`${field}[]`] = [];
            params[`${field}[]`].push(v);
          });
        } else {
          params[`${field}[]`] = [value];
        }
      } else {
        params[`${field}[]`] = Array.isArray(value) ? value : [value];
      }
      break;

    case "contains":
      params[field] = value;
      break;

    case "between":
      if (Array.isArray(value) && value.length === 2) {
        const [min, max] = value;

        if (isDateField(field)) {
          params[`${field}[after]`] = min;
          params[`${field}[before]`] = max;
        } else {
          // Handle sentinel values for guest filters, price, duration, flexibility
          const sentinelValue = SENTINEL_VALUES[field as keyof typeof SENTINEL_VALUES];

          // Add minimum filter if > 0
          if (min > 0) {
            params[`${field}[gte]`] = min;
          }

          // Add maximum filter only if not at sentinel value
          if (sentinelValue === undefined || max < sentinelValue) {
            params[`${field}[lte]`] = max;
          }
        }
      }
      break;

    case "after":
      if (isDateField(field)) {
        params[`${field}[after]`] = value;
      } else {
        params[`${field}[gt]`] = value;
      }
      break;

    case "before":
      if (isDateField(field)) {
        params[`${field}[before]`] = value;
      } else {
        params[`${field}[lt]`] = value;
      }
      break;
  }
};

/**
 * Map Refine CrudFilters to Hydra API Platform query parameters
 */
export const mapFilters = (filters: CrudFilters = []): Record<string, any> => {
  const params: Record<string, any> = {};

  for (const filter of filters) {
    if ("field" in filter) {
      const { field, operator, value } = filter;
      mapFilterOperator(field, operator, value, params);
    }
  }

  return params;
};

/**
 * Map Refine CrudSorting to Hydra API Platform order parameters
 */
export const mapSorters = (sorters: CrudSorting = []): Record<string, any> => {
  if (!sorters.length) return {};

  const orderParams: Record<string, "asc" | "desc"> = {};

  for (const sorter of sorters) {
    // Map frontend 'childs' to backend 'children'
    const field = sorter.field === 'childs' ? 'children' : sorter.field;
    orderParams[`order[${field}]`] = (sorter.order as "asc" | "desc") ?? "asc";
  }

  return orderParams;
};

/**
 * Convert query parameters object to URL query string
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};