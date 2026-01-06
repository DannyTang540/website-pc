// Base URL for backend static files
const getBaseUrl = (): string => {
  const apiUrlRaw = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Remove trailing /api to get base URL for static files
  const baseUrl = apiUrlRaw.replace(/\/api\/?$/, "");

  // In development, prefer Vite proxy for localhost to avoid CORS,
  // but if VITE_API_URL points to a remote host (Railway/Vercel),
  // we must use absolute URLs so images load correctly.
  if (import.meta.env.DEV) {
    const isAbsoluteHttp = /^https?:\/\//i.test(apiUrlRaw);
    const isLocalhost =
      /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(apiUrlRaw);

    if (isAbsoluteHttp && !isLocalhost) {
      return baseUrl;
    }

    return "";
  }

  return baseUrl;
};

// Placeholder image - inline SVG data URI
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect fill='%23f0f0f0' width='300' height='300'/%3E%3Ctext fill='%23999' font-family='Arial' font-size='14' text-anchor='middle' x='150' y='150'%3ENo Image%3C/text%3E%3C/svg%3E";

export const normalizeImageUrl = (image: any): string => {
  if (!image) return PLACEHOLDER;

  // Handle string images
  if (typeof image === "string") {
    // Skip empty strings
    if (!image.trim()) return PLACEHOLDER;

    // Skip placeholder paths
    if (image.includes("placeholder")) return PLACEHOLDER;

    // Try to parse JSON string (handle case like "[...]" or "{...}")
    if (image.startsWith("[") || image.startsWith("{")) {
      try {
        const parsed = JSON.parse(image);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return normalizeImageUrl(parsed[0]);
        }
        if (parsed && typeof parsed === "object" && parsed.url) {
          return normalizeImageUrl(parsed.url);
        }
      } catch {
        // Not valid JSON, continue processing as string
      }
    }

    // Already absolute URL
    if (
      image.startsWith("http") ||
      image.startsWith("//") ||
      image.startsWith("data:")
    ) {
      return image;
    }

    // Normalize common stored paths to match backend static mount.
    // Backend serves files at /uploads (from public/uploads).
    let normalizedPath = image
      .replace(/\\/g, "/")
      .replace(/^\.\//, "")
      .replace(/^public\//, "")
      .replace(/^backend\/public\//, "")
      .replace(/^frontend\/website-pc\/public\//, "");

    // If path still contains '/public/uploads', strip the '/public'
    normalizedPath = normalizedPath.replace(/\/public\/uploads\//, "/uploads/");

    // Ensure it starts with /uploads when it points into uploads
    if (normalizedPath.startsWith("uploads/")) {
      normalizedPath = `/${normalizedPath}`;
    }

    // Local path - add base URL
    const baseUrl = getBaseUrl();
    const path = normalizedPath.startsWith("/")
      ? normalizedPath
      : `/${normalizedPath}`;
    return `${baseUrl}${path}`;
  }

  // Handle object with url property
  if (image && typeof image === "object" && image.url) {
    return normalizeImageUrl(image.url);
  }

  return PLACEHOLDER;
};

export const getFirstProductImage = (product: any): string => {
  if (!product) return PLACEHOLDER;

  // Debug log
  console.log(
    "[getFirstProductImage] Product:",
    product.name,
    "Images:",
    product.images
  );

  // Helper to get images array from product
  let imagesArray: any[] = [];

  if (Array.isArray(product.images)) {
    imagesArray = product.images;
  } else if (typeof product.images === "string" && product.images.trim()) {
    // Try to parse JSON string
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) {
        imagesArray = parsed;
      }
    } catch {
      // If not JSON, treat as single URL
      if (!product.images.includes("placeholder")) {
        return normalizeImageUrl(product.images);
      }
    }
  }

  // Check images array
  if (imagesArray.length > 0) {
    const firstImage = imagesArray[0];
    if (firstImage) {
      // Handle string image
      if (typeof firstImage === "string" && firstImage.trim()) {
        const normalized = normalizeImageUrl(firstImage);
        if (normalized !== PLACEHOLDER) return normalized;
      }
      // Handle object image with url property
      if (typeof firstImage === "object" && firstImage.url) {
        const normalized = normalizeImageUrl(firstImage.url);
        if (normalized !== PLACEHOLDER) return normalized;
      }
    }
  }

  // Then check product.image
  if (product.image) {
    // Handle string image
    if (typeof product.image === "string" && product.image.trim()) {
      const normalized = normalizeImageUrl(product.image);
      if (normalized !== PLACEHOLDER) return normalized;
    }
    // Handle object image with url property
    if (typeof product.image === "object" && product.image.url) {
      const normalized = normalizeImageUrl(product.image.url);
      if (normalized !== PLACEHOLDER) return normalized;
    }
  }

  return PLACEHOLDER;
};

// Helper function to get images array from product
const getImagesArray = (product: any): any[] => {
  if (!product) return [];

  if (Array.isArray(product.images)) {
    return product.images;
  }

  if (typeof product.images === "string" && product.images.trim()) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Not JSON, ignore
    }
  }

  return [];
};

// Get product image by index (for hover effect)
export const getProductImageByIndex = (
  product: any,
  index: number = 0
): string => {
  if (!product) return PLACEHOLDER;

  // Get images array
  const imagesArray = getImagesArray(product);

  if (imagesArray.length > index) {
    const targetImage = imagesArray[index];
    if (targetImage) {
      // Handle string image
      if (typeof targetImage === "string" && targetImage.trim()) {
        return normalizeImageUrl(targetImage);
      }
      // Handle object image with url property
      if (typeof targetImage === "object" && targetImage.url) {
        return normalizeImageUrl(targetImage.url);
      }
    }
  }

  // Fallback to first image
  return getFirstProductImage(product);
};

// Helper to extract URL from image (string or object)
const getImageUrl = (img: any): string | null => {
  if (typeof img === "string" && img.trim() && !img.includes("placeholder")) {
    return img;
  }
  if (typeof img === "object" && img?.url && !img.url.includes("placeholder")) {
    return img.url;
  }
  return null;
};

// Check if product has multiple valid images
export const hasMultipleImages = (product: any): boolean => {
  if (!product) return false;

  const imagesArray = getImagesArray(product);
  if (!imagesArray.length) return false;

  // Count valid images (non-empty strings or objects with url, not placeholder)
  const validImages = imagesArray.filter(
    (img: any) => getImageUrl(img) !== null
  );
  return validImages.length > 1;
};
