import React from 'react';

const VARIANT_CLASS = {
  hero: 'h-28 w-auto max-w-[min(100%,300px)] md:h-36',
  sidebar: 'h-9 w-auto max-w-[104px]',
  inline: 'h-9 w-auto max-w-[120px]',
  otp: 'h-16 w-auto max-w-[200px] md:h-[4.5rem]',
  loader: 'h-20 w-auto md:h-24',
  corner: 'h-10 w-10 max-w-[44px] md:h-11 md:w-11',
} as const;

export type BrandLogoVariant = keyof typeof VARIANT_CLASS;

export const BRAND_LOGO_SRC = '/brand/rider-logo.png';

export interface BrandLogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  variant?: BrandLogoVariant;
  /** Lightens flat black in the PNG so it disappears on near-black UI surfaces */
  blendOnDark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'inline',
  className = '',
  blendOnDark = false,
  alt = 'GigEase',
  ...rest
}) => (
  <img
    src={BRAND_LOGO_SRC}
    alt={alt}
    className={`${VARIANT_CLASS[variant]} object-contain object-center select-none ${
      blendOnDark ? 'mix-blend-lighten' : ''
    } ${className}`.trim()}
    draggable={false}
    {...rest}
  />
);
