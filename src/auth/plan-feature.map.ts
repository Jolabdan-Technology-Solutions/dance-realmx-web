import { Feature } from './enums/feature.enum';
import { SubscriptionTier } from '@prisma/client';

export const PlanFeatureMap: Record<SubscriptionTier, Feature[]> = {
  [SubscriptionTier.FREE]: [
    Feature.PURCHASE_CURRICULUM,
    Feature.SEARCH_PROFESSIONALS,
    Feature.TAKE_CERT_COURSE,
  ],
  [SubscriptionTier.NOBILITY]: [
    Feature.PURCHASE_CURRICULUM,
    Feature.SEARCH_PROFESSIONALS,
    Feature.TAKE_CERT_COURSE,
    Feature.BE_BOOKED,
    Feature.SELL_CURRICULUM,
  ],
  [SubscriptionTier.ROYAL]: [
    Feature.PURCHASE_CURRICULUM,
    Feature.SEARCH_PROFESSIONALS,
    Feature.TAKE_CERT_COURSE,
    Feature.BE_BOOKED,
    Feature.SELL_CURRICULUM,
    Feature.CONTACT_BOOK,
  ],
  [SubscriptionTier.IMPERIAL]: [
    Feature.PURCHASE_CURRICULUM,
    Feature.SEARCH_PROFESSIONALS,
    Feature.TAKE_CERT_COURSE,
    Feature.BE_BOOKED,
    Feature.SELL_CURRICULUM,
    Feature.CONTACT_BOOK,
    Feature.FEATURED_SELLER,
  ],
};
