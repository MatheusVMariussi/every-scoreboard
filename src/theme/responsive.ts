import { Dimensions, PixelRatio } from 'react-native';

const BASE_WIDTH = 375;

const getScreenWidth = () => Dimensions.get('window').width;
const getScreenHeight = () => Dimensions.get('window').height;

export const wp = (widthPercent: string | number): number => {
  const percent = typeof widthPercent === 'string' ? parseFloat(widthPercent) : widthPercent;
  return PixelRatio.roundToNearestPixel((getScreenWidth() * percent) / 100);
};

export const hp = (heightPercent: string | number): number => {
  const percent = typeof heightPercent === 'string' ? parseFloat(heightPercent) : heightPercent;
  return PixelRatio.roundToNearestPixel((getScreenHeight() * percent) / 100);
};

/**
 * Moderate scale — scales a pixel value proportionally to screen width,
 * dampened by `factor` so values don't grow too aggressively on large screens.
 * Default factor 0.5 means the value scales at half the rate of the screen.
 *
 * Divides by fontScale to counteract Android's system font/display zoom,
 * which would otherwise double-scale text rendered with these values.
 * On iOS (fontScale = 1.0) this has zero effect.
 */
export const ms = (size: number, factor = 0.5): number => {
  const { width, height } = Dimensions.get('window');
  const shortSide = Math.min(width, height);
  const scale = shortSide / BASE_WIDTH;
  const fontScale = PixelRatio.getFontScale();

  let result: number;
  if (scale < 1) {
    result = size * scale;
  } else {
    result = size + (scale - 1) * size * factor;
  }

  return result / fontScale;
};
