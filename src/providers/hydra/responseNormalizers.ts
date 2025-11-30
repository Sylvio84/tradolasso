import type { BaseRecord } from "@refinedev/core";

/**
 * Extract ID from Hydra IRI format
 * Converts "/api/resource/123" to "123"
 */
const iriToId = (iri?: string): string | undefined =>
  iri ? iri.split("/").filter(Boolean).pop() : undefined;

/**
 * Normalize Hydra API Platform responses to Refine format
 * Ensures each record has an 'id' field for Refine compatibility
 */
export const normalize = <T extends Record<string, any>>(item: T): T & BaseRecord => {
  const id = item.id ?? iriToId(item["@id"]);
  return { id, ...item };
};

/**
 * Process and clean enquiry data for frontend consumption
 * Handles problematic properties that might cause rendering issues
 */
export const processEnquiryData = (item: any) => {
  const normalized = normalize(item);

  // Clean up problematic properties that Antd might try to iterate over
  if (typeof normalized.internalMemo === 'string') {
    try {
      normalized.internalMemo = JSON.parse(normalized.internalMemo);
    } catch {
      normalized.internalMemo = [];
    }
  }

  return normalized;
};

/**
 * Extract total count from Hydra collection responses
 */
export const extractTotalFromHydraResponse = (data: any, fallbackLength: number): number => {
  return typeof data.totalItems === "number" ? data.totalItems : fallbackLength;
};

/**
 * Extract items array from Hydra collection responses
 */
export const extractItemsFromHydraResponse = (data: any): any[] => {
  if (Array.isArray(data.member)) {
    return data.member;
  } else if (Array.isArray(data)) {
    return data;
  } else {
    return [];
  }
};