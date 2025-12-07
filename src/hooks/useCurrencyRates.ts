import { useState, useEffect, useCallback } from "react";
import { http, cacheService } from "../providers/hydra";

interface CurrencyRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  lastUpdatedAt?: string;
}

interface HydraResponse {
  member: CurrencyRate[];
}

interface UseCurrencyRatesReturn {
  rates: Map<string, number> | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getRate: (currency: string | null) => number;
}

/**
 * Hook to fetch and cache currency conversion rates.
 *
 * Fetches rates from /api/currency-rates endpoint and caches them for 4 hours.
 * Rates are inverted from API format (1 EUR = X target) to (1 target = Y EUR).
 *
 * @returns Object with rates Map, loading state, error, refetch function, and getRate helper
 */
export function useCurrencyRates(): UseCurrencyRatesReturn {
  const [rates, setRates] = useState<Map<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRates = useCallback(async () => {
    // 1. Check cache first
    const cached = cacheService.get<Map<string, number>>("currency-rates");
    if (cached) {
      setRates(cached);
      setLoading(false);
      return;
    }

    // 2. Fetch from API
    setLoading(true);
    setError(null);

    try {
      const { data } = await http("/currency-rates?currency=EUR");
      const hydraData = data as HydraResponse;

      // 3. Transform and invert rates
      const ratesMap = new Map<string, number>();

      // Always add EUR with rate 1.0
      ratesMap.set("EUR", 1.0);

      // Process each currency rate
      for (const item of hydraData.member || []) {
        // API returns: 1 EUR = X targetCurrency
        // We need: 1 targetCurrency = Y EUR
        // So: Y = 1 / X
        const invertedRate = 1 / item.rate;
        ratesMap.set(item.targetCurrency, invertedRate);
      }

      // 4. Cache and set state
      cacheService.set("currency-rates", ratesMap);
      setRates(ratesMap);
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj);
      console.error("Failed to fetch currency rates:", err);

      // Set empty rates map as fallback so getRate still works
      const fallbackRates = new Map<string, number>();
      fallbackRates.set("EUR", 1.0);
      setRates(fallbackRates);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch rates on mount
  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  /**
   * Get conversion rate for a currency.
   * Returns 1.0 for EUR or null/undefined currencies (defaults to EUR).
   * Returns 1.0 as fallback if currency not found in rates.
   *
   * @param currency - The currency code (e.g., "USD", "GBP") or null
   * @returns The conversion rate (1 currency unit = X EUR)
   */
  const getRate = useCallback(
    (currency: string | null): number => {
      // Default to EUR (rate = 1.0) if no currency specified
      if (!currency || currency === "EUR") return 1.0;

      // Return cached rate or default to 1.0 if not found
      return rates?.get(currency) || 1.0;
    },
    [rates]
  );

  return {
    rates,
    loading,
    error,
    refetch: fetchRates,
    getRate,
  };
}
