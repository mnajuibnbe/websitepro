import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEFAULT_PRICING_CONTEXT, PricingContext as PricingContextValue } from '../lib/pricing';
import { useAuth } from './AuthContext';
export interface PricingContextState extends PricingContextValue { isLoading: boolean; error: string | null; refresh: () => void; }
const Context = createContext<PricingContextState>({ ...DEFAULT_PRICING_CONTEXT, isLoading: true, error: null, refresh: () => undefined });
export function PricingProvider({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  const [value, setValue] = useState(DEFAULT_PRICING_CONTEXT);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const refresh = useCallback(() => setRequestVersion(value => value + 1), []);
  useEffect(() => {
    if (isLoading) return;
    const controller = new AbortController();
    setPricingLoading(true); setError(null);
    fetch('/api/pricing/context', { headers: token ? { Authorization: `Bearer ${token}` } : undefined, signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('pricing context unavailable')))
      .then(setValue).catch(error => { if (error.name !== 'AbortError') { setValue(DEFAULT_PRICING_CONTEXT); setError('Regional pricing is unavailable. Showing USD prices.'); } })
      .finally(() => { if (!controller.signal.aborted) setPricingLoading(false); });
    return () => controller.abort();
  }, [isLoading, token, requestVersion]);
  return <Context.Provider value={{ ...value, isLoading: pricingLoading, error, refresh }}>{children}</Context.Provider>;
}
export const usePricingContext = () => useContext(Context);
