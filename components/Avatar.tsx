import React, { useMemo } from 'react';
import { AvatarOptions } from '../types';

interface AvatarProps {
  avatarOptions?: AvatarOptions | null;
  className?: string;
}

/**
 * Helpers:
 * - normalizeColorParam handles string | string[] | undefined
 * - strips leading '#' if present
 * - returns null if value is empty / invalid
 */
const normalizeColorParam = (val?: string | string[] | null): string | null => {
  if (val === undefined || val === null) return null;
  const arr = Array.isArray(val) ? val : [String(val)];

  const cleaned = arr
    .map(v => v?.toString().trim().replace(/^#/, ''))
    .filter(Boolean)
    .map(v => {
      const lower = v.toLowerCase();
      if (lower === 'transparent') return 'transparent';
      const hex = lower.replace(/[^a-f0-9]/g, '');
      if (hex.length === 6) return hex;
      if (hex.length === 3) return hex.split('').map(c => c + c).join('');
      return null;
    })
    .filter(Boolean) as string[];

  if (cleaned.length === 0) return null;
  return cleaned.join(',');
};

const Avatar: React.FC<AvatarProps> = ({ avatarOptions, className = '' }) => {
  const opts = (avatarOptions || {}) as Partial<AvatarOptions>;
  const {
    seed,
    hair,
    hairColor,
    skinColor,
    eyes,
    mouth,
    earrings,
    earringsProbability,
    glasses,
    glassesProbability,
    facialHair,
    facialHairProbability,
    shirt,
    baseColor
  } = opts;

  const src = useMemo(() => {
    const url = new URL(`https://api.dicebear.com/9.x/micah/svg`);
    url.searchParams.set('seed', seed ?? '');

    const setIfStringArray = (key: string, val?: string | string[] | null) => {
      if (!val) return;
      const output = Array.isArray(val) ? val.join(',') : String(val);
      if (output) url.searchParams.set(key, output);
    };

    setIfStringArray('hair', hair);
    setIfStringArray('hairColor', hairColor);

    const skinParam = normalizeColorParam(skinColor);
    if (skinParam) url.searchParams.set('baseColor', skinParam);

    setIfStringArray('eyes', eyes);
    setIfStringArray('mouth', mouth);
    setIfStringArray('shirt', shirt);

    const shirtColorParam = normalizeColorParam(baseColor);
    if (shirtColorParam) url.searchParams.set('shirtColor', shirtColorParam);

    const earringColor = normalizeColorParam(earrings);
    if (earringColor) url.searchParams.set('earringColor', earringColor);

    const glassesColor = normalizeColorParam(glasses);
    if (glassesColor) url.searchParams.set('glassesColor', glassesColor);

    const facialHairColor = normalizeColorParam(facialHair);
    if (facialHairColor) url.searchParams.set('facialHairColor', facialHairColor);

    if (typeof earringsProbability !== 'undefined') {
      url.searchParams.set('earringsProbability', String(earringsProbability));
    }
    if (typeof glassesProbability !== 'undefined') {
      url.searchParams.set('glassesProbability', String(glassesProbability));
    }
    if (typeof facialHairProbability !== 'undefined') {
      url.searchParams.set('facialHairProbability', String(facialHairProbability));
    }

    // ⚙️ Force refresh by adding a cache-busting param
    const src = url.toString().replace(/%2C/g, ',');
    const cacheBuster = encodeURIComponent(JSON.stringify(avatarOptions ?? {}));
    return `${src}&cb=${cacheBuster}`;
  }, [avatarOptions, seed, hair, hairColor, skinColor, eyes, mouth, earrings, glasses, facialHair, shirt, baseColor]);

  return (
    <img
      key={src}  // forces React to re-render when URL changes
      src={src}
      alt={`${seed ?? 'avatar'}`}
      className={className}
    />
  );
};

export default Avatar;
