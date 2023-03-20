import {
  SUPPORT_SCREEN_ENCODER_CONFIG_LIST,
  SUPPORT_VIDEO_ENCODER_CONFIG_LIST,
} from 'qnweb-rtc'

export const allCameraPresets = [
  '360p',
  '480p',
  '720p',
  '1080p',
  '1440p',
  '4k',
] as const // satisfies readonly (keyof typeof SUPPORT_VIDEO_ENCODER_CONFIG_LIST)[]

export const allCameraPresetsText = {
  '360p': '360p (640 × 360, 15fps@400Kbps)',
  '480p': '480p (640 × 480, 15fps@500Kbps)',
  '720p': '720p (1280 × 720, 30fps@1130Kbps)',
  '1080p': '1080p (1920 × 1080, 30fps@2080Kbps)',
  '1440p': '1440p (2560 × 1440, 30fps@4850Kbps)',
  '4k': '2160p (3840 × 2160, 30fps@8910Kbps)',
} as const // satisfies Record<typeof allCameraPresets[number], string>

export const allScreenPresets = ['480p', '720p', '1080p'] as const
// satisfies readonly (keyof typeof SUPPORT_SCREEN_ENCODER_CONFIG_LIST)[]

export const allScreenPresetsText = {
  '480p': '480p (640 × 480, 15fps@500Kbps)',
  '720p': '720p (1280 × 720, 30fps@1130Kbps)',
  '1080p': '1080p (1920 × 1080, 30fps@3000Kbps)',
}
