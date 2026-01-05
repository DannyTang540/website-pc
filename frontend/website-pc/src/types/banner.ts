// frontend/website-pc/src/types/banner.ts

// Base banner type that matches your API response
export interface Banner {
  id: string;
  name: string;
  type: 'image' | 'video' | 'slider';
  position: 'top' | 'middle' | 'bottom' | 'sidebar';
  image: string;  // Changed from imageUrl to match your usage
  thumbnailUrl?: string;
  title: string;
  description: string;
  buttonText: string;
  link: string;  // Changed from buttonLink to match your usage
  startDate: string;
  endDate: string;
  isActive: boolean;
  order: number;  // Changed from priority to match your usage
  targetUrl: string;
  opensInNewTab: boolean;
  createdAt: string;
  updatedAt: string;
}

// Type for creating a new banner
export interface CreateBannerData {
  name: string;
  type: 'image' | 'video' | 'slider';
  position: 'top' | 'middle' | 'bottom' | 'sidebar';
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  priority: number;
  targetUrl: string;
  opensInNewTab: boolean;
}

// Type for updating a banner
export interface UpdateBannerData extends Partial<Omit<CreateBannerData, 'id'>> {
  id: string;
}

export interface BannerFormValues {
  title: string;
  description: string;
  image: string | File | null;  // Changed from imageUrl to image
  type: 'image' | 'video' | 'slider';
  position: 'top' | 'middle' | 'bottom' | 'sidebar';
  targetUrl: string;
  buttonText: string;
  isActive: boolean;
  order: number;  // Changed from priority to order
  startDate: Date;
  endDate: Date;
  opensInNewTab: boolean;
}

// Type for banner list item (simplified version for listing)
export interface BannerListItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'slider';
  position: 'top' | 'middle' | 'bottom' | 'sidebar';
  imageUrl: string;
  isActive: boolean;
  priority: number;
  startDate: string;
  endDate: string;
}

// Type for banner filter options
export interface BannerFilterOptions {
  isActive?: boolean;
  type?: 'image' | 'video' | 'slider';
  position?: 'top' | 'middle' | 'bottom' | 'sidebar';
  searchTerm?: string;
}

// Type for banner API response
export interface BannerApiResponse {
  data: Banner | Banner[];
  message?: string;
  success: boolean;
  total?: number;
}

// Type for banner position options
export const BANNER_POSITIONS = ['top', 'middle', 'bottom', 'sidebar'] as const;
export type BannerPosition = typeof BANNER_POSITIONS[number];

// Type for banner type options
export const BANNER_TYPES = ['image', 'video', 'slider'] as const;
export type BannerType = typeof BANNER_TYPES[number];
