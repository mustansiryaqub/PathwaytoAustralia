import Purchases, {
  type PurchasesPackage,
  type CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import type { SubscriptionOffering } from '@/types';

const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY!;

// Entitlement identifier configured in RevenueCat dashboard
export const PREMIUM_ENTITLEMENT_ID = 'premium';

// Product identifiers (must match Google Play Console)
export const PRODUCT_IDS = {
  MONTHLY: 'australiapath_premium_monthly',
  ANNUAL: 'australiapath_premium_annual',
} as const;

// Offering identifier in RevenueCat dashboard
export const OFFERING_ID = 'default';

// ── Initialise RevenueCat ─────────────────────────────────────
export async function initRevenueCat(userId?: string): Promise<void> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

  if (__DEV__) {
    await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  await Purchases.configure({
    apiKey: ANDROID_API_KEY,
    appUserID: userId ?? null,
  });
}

// ── Identify a signed-in user ─────────────────────────────────
export async function identifyUser(userId: string): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.logIn(userId);
  return customerInfo;
}

// ── Log out / reset to anonymous ─────────────────────────────
export async function logOutRevenueCat(): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.logOut();
  return customerInfo;
}

// ── Get current customer info ─────────────────────────────────
export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

// ── Check if user has premium entitlement ────────────────────
export async function isPremiumActive(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return PREMIUM_ENTITLEMENT_ID in info.entitlements.active;
  } catch {
    return false;
  }
}

// ── Fetch available offerings ─────────────────────────────────
export async function getOfferings(): Promise<SubscriptionOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return null;

    return {
      identifier: current.identifier,
      serverDescription: current.serverDescription,
      monthly: current.monthly
        ? packageToSubscription(current.monthly)
        : null,
      annual: current.annual
        ? packageToSubscription(current.annual)
        : null,
      availablePackages: current.availablePackages.map(packageToSubscription),
    };
  } catch (error) {
    console.error('RevenueCat getOfferings error:', error);
    return null;
  }
}

// ── Purchase a package ────────────────────────────────────────
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const hasPremium = PREMIUM_ENTITLEMENT_ID in customerInfo.entitlements.active;
    return {
      success: hasPremium,
      customerInfo,
      error: hasPremium ? undefined : 'Purchase completed but entitlement not active',
    };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    return {
      success: false,
      error: error.message ?? 'Purchase failed. Please try again.',
    };
  }
}

// ── Restore purchases ─────────────────────────────────────────
export async function restorePurchases(): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    const hasPremium = PREMIUM_ENTITLEMENT_ID in customerInfo.entitlements.active;
    return { success: hasPremium, customerInfo };
  } catch (error: any) {
    return { success: false, error: error.message ?? 'Restore failed.' };
  }
}

// ── Helpers ───────────────────────────────────────────────────
function packageToSubscription(pkg: PurchasesPackage) {
  return {
    identifier: pkg.identifier,
    packageType: pkg.packageType,
    priceString: pkg.storeProduct.priceString,
    product: {
      title: pkg.storeProduct.title,
      description: pkg.storeProduct.description,
      priceAmountMicros: pkg.storeProduct.price * 1_000_000,
      priceCurrencyCode: pkg.storeProduct.currencyCode,
    },
  };
}
