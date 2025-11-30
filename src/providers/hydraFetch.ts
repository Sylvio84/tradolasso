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

export const hydraFetchDataProvider = {
  default: {
    getList: async ({ resource, filters, pagination, sorters }) => {
      const params: any = {
        ...mapFilters(filters),
        ...mapSorters(sorters),
      };
      // Always add pagination params for server-side pagination
      params.page = pagination?.currentPage ?? pagination?.current ?? 1;
      params.itemsPerPage = pagination?.pageSize ?? 10;

      const { data } = await http(`/${resource}${buildQueryString(params)}`);

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
      const { data } = await http(`/${resource}/${id}`);
      return { data: normalize(data) };
    },

    getMany: async ({ resource, ids }) => {
      const results = await Promise.all(
        ids.map((id) => http(`/${resource}/${id}`))
      );
      return { data: results.map((r) => normalize(r.data)) };
    },

    create: async ({ resource, variables }) => {
      const { data, headers, status } = await http(`/${resource}`, {
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
      const { data } = await http(`/${resource}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/merge-patch+json" },
        body: JSON.stringify(variables),
      });
      return { data: normalize(data) };
    },

    deleteOne: async ({ resource, id }) => {
      await http(`/${resource}/${id}`, { method: "DELETE" });
      return { data: { id } as BaseRecord };
    },

    getApiUrl: () => API_URL,
  },
};