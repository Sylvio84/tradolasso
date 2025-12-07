import type { BaseRecord } from "@refinedev/core";
import { API_URL } from "../config/api";
import {
  http,
  normalize,
  processEnquiryData,
  extractTotalFromHydraResponse,
  extractItemsFromHydraResponse,
  mapFilters,
  mapSorters,
  buildQueryString
} from "./hydra";

// Map resource names to API endpoints
const RESOURCE_ENDPOINT_MAP: Record<string, string> = {
  funds: "assets",
  forex: "assets",
  crypto: "assets",
  indexes: "assets",
};

const getEndpoint = (resource: string): string => {
  return RESOURCE_ENDPOINT_MAP[resource] || resource;
};

const dataProvider = {
  getList: async ({ resource, filters, pagination, sorters }) => {
      const params: any = {
        ...mapFilters(filters),
        ...mapSorters(sorters),
      };
      // Always add pagination params for server-side pagination
      params.page = pagination?.currentPage ?? pagination?.current ?? 1;
      params.itemsPerPage = pagination?.pageSize ?? 10;

      const endpoint = getEndpoint(resource);
      const { data } = await http(`/${endpoint}${buildQueryString(params)}`);

      // Extract items array from Hydra response
      const itemsArray = extractItemsFromHydraResponse(data);

      // Process and normalize items (especially for enquiries)
      const items = itemsArray.map(item =>
        resource === 'enquiries' ? processEnquiryData(item) : normalize(item)
      );

      // Extract total count
      const total = extractTotalFromHydraResponse(data, items.length);

      return { data: items, total };
    },

    getOne: async ({ resource, id }) => {
      const endpoint = getEndpoint(resource);
      const { data } = await http(`/${endpoint}/${id}`);
      return { data: normalize(data) };
    },

    getMany: async ({ resource, ids }) => {
      const endpoint = getEndpoint(resource);
      const results = await Promise.all(
        ids.map((id) => http(`/${endpoint}/${id}`))
      );
      return { data: results.map((r) => normalize(r.data)) };
    },

    create: async ({ resource, variables }) => {
      const endpoint = getEndpoint(resource);
      const { data, headers, status } = await http(`/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/ld+json" },
        body: JSON.stringify(variables),
      });

      if (status === 201 && data && Object.keys(data).length) {
        return { data: normalize(data) };
      }
      const location = headers.get("Location");
      if (location) {
        const created = await http(location.replace(API_URL, ""));
        return { data: normalize(created.data) };
      }
      return { data: normalize(data) };
    },

    update: async ({ resource, id, variables }) => {
      const endpoint = getEndpoint(resource);
      const { data } = await http(`/${endpoint}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(variables),
      });
      return { data: normalize(data) };
    },

    deleteOne: async ({ resource, id }) => {
      const endpoint = getEndpoint(resource);
      await http(`/${endpoint}/${id}`, { method: "DELETE" });
      return { data: { id } as BaseRecord };
    },

  getApiUrl: () => API_URL,
};

export const hydraFetchDataProvider = dataProvider;