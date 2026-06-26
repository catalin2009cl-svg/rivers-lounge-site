'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface SiteLogoProps {
  lightSrc: string;
  darkSrc?: string | null;
  width?: number;
  height?: number;
  priority?: boolean;
}

export function SiteLogo({
  lightSrc,
  darkSrc,
  width = 140,
  height = 44,
  priority = false,
}: SiteLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const src = isDark && darkSrc ? darkSrc : lightSrc;
  // If no dedicated dark logo, invert the light logo for dark mode
  const filter = isDark && !darkSrc ? 'brightness(0) invert(1)' : 'none';

  return (
    <Image
      src={src}
      alt="River's Lounge"
      width={width}
      height={height}
      priority={priority}
      style={{ objectFit: 'contain', filter, transition: 'filter 0.2s ease' }}
      unoptimized
    />
  );
}
