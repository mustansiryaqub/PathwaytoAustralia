import { useState, useCallback } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  isPremiumActive,
} from '@/lib/revenuecat';
import { profileQueries } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { SubscriptionOffering } from '@/types';

export function useSubscription() {
  const { user, profile, setProfile } = useAuthStore();
  const [offering, setOffering] = useState<SubscriptionOffering | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPremium = profile?.subscription_tier === 'premium';

  const loadOffering = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getOfferings();
      setOffering(result);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load pricing');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      if (!user) {
        return { success: false, error: 'Please sign in to purchase' };
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await purchasePackage(pkg);
        if (result.success && user.id) {
          await profileQueries.updateSubscription(
            user.id,
            'premium',
            result.customerInfo?.originalAppUserId
          );
          const updated = await profileQueries.get(user.id);
          setProfile(updated);
        }
        return result;
      } catch (e: any) {
        const msg = e.message ?? 'Purchase failed';
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [user, setProfile]
  );

  const restore = useCallback(async () => {
    if (!user) {
      return { success: false, error: 'Please sign in to restore purchases' };
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await restorePurchases();
      if (result.success && user.id) {
        await profileQueries.updateSubscription(user.id, 'premium');
        const updated = await profileQueries.get(user.id);
        setProfile(updated);
      }
      return result;
    } catch (e: any) {
      const msg = e.message ?? 'Restore failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  }, [user, setProfile]);

  const checkEntitlement = useCallback(async () => {
    const active = await isPremiumActive();
    if (active && user?.id && !isPremium) {
      await profileQueries.updateSubscription(user.id, 'premium');
      const updated = await profileQueries.get(user.id);
      setProfile(updated);
    }
    return active;
  }, [user?.id, isPremium, setProfile]);

  return {
    isPremium,
    offering,
    isLoading,
    error,
    loadOffering,
    purchase,
    restore,
    checkEntitlement,
  };
}
