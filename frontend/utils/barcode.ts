import {Point} from 'react-native-vision-camera';

/**
 * Calculate the center point of a barcode from its corner coordinates
 */
export function calculateBarcodeCenter(corners: Point[]): Point {
  if (corners.length === 0) {
    return {x: 0, y: 0};
  }

  const sumX = corners.reduce((sum, point) => sum + point.x, 0);
  const sumY = corners.reduce((sum, point) => sum + point.y, 0);

  return {
    x: sumX / corners.length,
    y: sumY / corners.length,
  };
}

/**
 * Calculate Euclidean distance between two points
 */
export function calculateDistance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}
