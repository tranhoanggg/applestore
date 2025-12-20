const isRemoteSource = (value = "") =>
  value.startsWith("data:") ||
  value.startsWith("http://") ||
  value.startsWith("https://") ||
  value.startsWith("blob:");

const sanitizeSegment = (text = "") =>
  text
    .toString()
    .trim()
    .replace(/[\\/]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, "");

export const normalizeAssetSegment = (value) => sanitizeSegment(value);

export const resolveProductImage = (name, image, type, sequence = 1) => {
  if (!image) return "";

  const normalized = image.toString().trim();

  if (isRemoteSource(normalized)) {
    return normalized;
  }

  // Allow reusing stored asset-relative paths
  if (/^\/?assets\//i.test(normalized)) {
    const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return withSlash.replace(/\/(\d+)\.(png|jpe?g|webp)$/i, `/${sequence}.$2`);
  }

  const normalizedType = (type || "").charAt(0).toUpperCase() + (type || "").slice(1);
  const safeName = sanitizeSegment(name);
  const folderSegment = sanitizeSegment(normalized.split("/").pop());

  if (!safeName || !folderSegment) return "";

  return `/assets/images/${normalizedType}/${safeName}/${folderSegment}/${sequence}.png`;
};
