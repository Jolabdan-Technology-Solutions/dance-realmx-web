import { SetMetadata } from '@nestjs/common';
import { Feature } from '../enums/feature.enum';

export const FEATURE_KEY = 'feature';
export const RequireFeature = (feature: Feature) =>
  SetMetadata(FEATURE_KEY, feature);
