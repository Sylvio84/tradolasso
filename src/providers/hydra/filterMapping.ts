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
 * Metric fields that use metric[field] format
 */
const METRIC_FIELDS = [
  'lassoScore',
  'visScore',
  'visStars',
  'globalStars',
  'piotrosBeneishSloanScore',
  'zonebourseScore',
  'zonebourseInvestisseur',
  'fintelScore',
] as const;

/**
 * Indicator fields that use indicator[field] format
 */
const INDICATOR_FIELDS = [
  'adx',
  'atr',
  'atrPercent',
  'sma200',
  'wma12',
  'distanceCloseSma200',
  'distanceWma12Sma200',
  'close',
] as const;

/**
 * Fields that use direct [field][gte/lte] format
 */
const RANGE_FIELDS = [
  'marketcap',
] as const;

/**
 * Get the API prefix for a field (metric, indicator, or none)
 */
const getFieldPrefix = (field: string): string => {
  if (METRIC_FIELDS.includes(field as typeof METRIC_FIELDS[number])) {
    return `metric[${field}]`;
  }
  if (INDICATOR_FIELDS.includes(field as typeof INDICATOR_FIELDS[number])) {
    return `indicator[${field}]`;
  }
  return field;
};

/**
 * Check if field is a metric or indicator field
 */
const isMetricOrIndicatorField = (field: string): boolean => {
  return METRIC_FIELDS.includes(field as typeof METRIC_FIELDS[number]) ||
         INDICATOR_FIELDS.includes(field as typeof INDICATOR_FIELDS[number]);
};

/**
 * Check if field is a range field (marketcap, etc.)
 */
const isRangeField = (field: string): boolean => {
  return RANGE_FIELDS.includes(field as typeof RANGE_FIELDS[number]);
};

/**
 * Map individual filter operator to API parameters
 */
const mapFilterOperator = (field: string, operator: string, value: any, params: Record<string, any>) => {
  const prefix = getFieldPrefix(field);

  switch (operator) {
    case "eq":
      // For metric/indicator fields, handle range filter format "min,max"
      if (isMetricOrIndicatorField(field) && typeof value === 'string' && value.includes(',')) {
        const [minVal, maxVal] = value.split(',');
        if (minVal) {
          params[`${prefix}[gte]`] = Number(minVal);
        }
        if (maxVal) {
          params[`${prefix}[lte]`] = Number(maxVal);
        }
      } else if (isMetricOrIndicatorField(field)) {
        // Single value means minimum filter
        params[`${prefix}[gte]`] = value;
      } else if (isRangeField(field) && typeof value === 'string' && value.includes(',')) {
        // For range fields like marketcap, handle "min,max" format
        const [minVal, maxVal] = value.split(',');
        if (minVal) {
          params[`${field}[gte]`] = minVal;
        }
        if (maxVal) {
          params[`${field}[lte]`] = maxVal;
        }
      } else {
        params[prefix] = value;
      }
      break;

    case "ne":
      params[`${prefix}[not]`] = value;
      break;

    case "lt":
      if (isDateField(field)) {
        params[`${prefix}[before]`] = value;
      } else {
        params[`${prefix}[lt]`] = value;
      }
      break;

    case "gt":
      if (isDateField(field)) {
        params[`${prefix}[after]`] = value;
      } else {
        params[`${prefix}[gt]`] = value;
      }
      break;

    case "gte":
      if (isDateField(field)) {
        params[`${prefix}[after]`] = value;
      } else {
        params[`${prefix}[gte]`] = value;
      }
      break;

    case "lte":
      if (isDateField(field)) {
        params[`${prefix}[before]`] = value;
      } else {
        params[`${prefix}[lte]`] = value;
      }
      break;

    case "in":
      if (field === 'tags') {
        // For tags, use the tags[] parameter format for multiple values
        if (Array.isArray(value)) {
          value.forEach(v => {
            if (!params[`${prefix}[]`]) params[`${prefix}[]`] = [];
            params[`${prefix}[]`].push(v);
          });
        } else {
          params[`${prefix}[]`] = [value];
        }
      } else {
        params[`${prefix}[]`] = Array.isArray(value) ? value : [value];
      }
      break;

    case "contains":
      params[prefix] = value;
      break;

    case "between":
      if (Array.isArray(value) && value.length === 2) {
        const [min, max] = value;

        if (isDateField(field)) {
          params[`${prefix}[after]`] = min;
          params[`${prefix}[before]`] = max;
        } else {
          // Handle sentinel values for guest filters, price, duration, flexibility
          const sentinelValue = SENTINEL_VALUES[field as keyof typeof SENTINEL_VALUES];

          // Add minimum filter if > 0
          if (min > 0) {
            params[`${prefix}[gte]`] = min;
          }

          // Add maximum filter only if not at sentinel value
          if (sentinelValue === undefined || max < sentinelValue) {
            params[`${prefix}[lte]`] = max;
          }
        }
      }
      break;

    case "after":
      if (isDateField(field)) {
        params[`${prefix}[after]`] = value;
      } else {
        params[`${prefix}[gt]`] = value;
      }
      break;

    case "before":
      if (isDateField(field)) {
        params[`${prefix}[before]`] = value;
      } else {
        params[`${prefix}[lt]`] = value;
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