/**
 * alphaTab library wrapper.
 * Handles initialization, AlphaTex loading, and configuration.
 */

import type { AlphaTabApi, Settings } from '@coderline/alphatab';

export interface AlphaTabInstance {
  api: AlphaTabApi;
  destroy: () => void;
}

/**
 * Initialize an alphaTab instance on the given container element.
 */
export function initAlphaTab(
  container: HTMLElement,
  alphaTex: string,
  options?: {
    enablePlayer?: boolean;
    enableCursor?: boolean;
    soundFontUrl?: string;
  },
): AlphaTabInstance {
  const { enablePlayer = false, enableCursor = false, soundFontUrl } = options ?? {};

  const settings: Partial<Settings> = {
    core: {
      tex: true,
      fontDirectory: '/font/',
    } as Settings['core'],
    display: {
      layoutMode: 1, // Page layout
      staveProfile: 4, // Tab
    } as Settings['display'],
    notation: {
      elements: new Map(),
    } as Settings['notation'],
  } as Partial<Settings>;

  if (enablePlayer && soundFontUrl) {
    (settings as Record<string, unknown>).player = {
      enablePlayer: true,
      enableCursor: enableCursor,
      enableUserInteraction: true,
      soundFont: soundFontUrl,
      scrollMode: 1, // Continuous scroll
    };
  }

  // Use the alphaTab API
  const api = new (window as unknown as Record<string, unknown>).alphaTab.AlphaTabApi(
    container,
    settings,
  ) as AlphaTabApi;

  // Load AlphaTex content
  api.tex(alphaTex);

  return {
    api,
    destroy: () => {
      api.destroy();
    },
  };
}

/**
 * Configure the MIDI player on an existing alphaTab instance.
 */
export function configurePlayer(
  api: AlphaTabApi,
  soundFontUrl: string,
): void {
  // Player configuration is set during init via settings.
  // This function is for reconfiguring an existing instance.
  // alphaTab handles SoundFont loading internally when player is enabled.
}
