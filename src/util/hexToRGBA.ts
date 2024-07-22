export function hexToRGBA(hex: string, alpha: number): string {
  // Remove the hash symbol if present
  hex = hex.replace("#", "");

  // Split the hex value into RGB components
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Create the RGBA color value
  const rgba = `rgba(${r}, ${g}, ${b}, ${alpha})`;
  return rgba;
}
