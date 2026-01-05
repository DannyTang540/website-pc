// types/component.ts

// Base interface for all component specifications
export interface ComponentSpecification {
  name: string;
  value: string | number | boolean;
  type?: 'text' | 'number' | 'boolean' | 'select' | 'range';
  unit?: string; // e.g., 'GHz', 'GB', 'W'
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  min?: number;
  max?: number;
  step?: number;
}

// Base interface for all computer components
export interface BaseComponent {
  id: string;
  name: string;
  type: ComponentType;
  brand: string;
  model: string;
  price: number;
  image?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  specifications: ComponentSpecification[];
  compatibility?: CompatibilityInfo;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Specific component types with their unique properties
export interface CPUComponent extends BaseComponent {
  type: 'cpu';
  specifications: (ComponentSpecification & {
    name: 'cores' | 'threads' | 'baseClock' | 'boostClock' | 'tdp' | 'socket';
  })[];
}

export interface GPUComponent extends BaseComponent {
  type: 'gpu';
  specifications: (ComponentSpecification & {
    name: 'vram' | 'baseClock' | 'boostClock' | 'tdp' | 'length' | 'powerConnectors';
  })[];
}

export interface RAMComponent extends BaseComponent {
  type: 'ram';
  specifications: (ComponentSpecification & {
    name: 'capacity' | 'speed' | 'type' | 'latency' | 'voltage';
  })[];
}

export interface MotherboardComponent extends BaseComponent {
  type: 'motherboard';
  specifications: (ComponentSpecification & {
    name: 'socket' | 'formFactor' | 'ramSlots' | 'maxRam' | 'ramType' | 'm2Slots' | 'sataPorts';
  })[];
}

export interface PSUComponent extends BaseComponent {
  type: 'psu';
  specifications: (ComponentSpecification & {
    name: 'wattage' | 'efficiency' | 'modular' | 'formFactor' | 'pcieConnectors';
  })[];
}

export interface CaseComponent extends BaseComponent {
  type: 'case';
  specifications: (ComponentSpecification & {
    name: 'formFactor' | 'maxGpuLength' | 'maxCoolerHeight' | 'driveBays' | 'fanSupport';
  })[];
}

export interface CoolerComponent extends BaseComponent {
  type: 'cooler';
  specifications: (ComponentSpecification & {
    name: 'type' | 'socket' | 'noiseLevel' | 'fanSpeed' | 'height' | 'tdp';
  })[];
}

export interface StorageComponent extends BaseComponent {
  type: 'storage';
  specifications: (ComponentSpecification & {
    name: 'capacity' | 'type' | 'readSpeed' | 'writeSpeed' | 'interface' | 'formFactor';
  })[];
}

// Union type for all component types
export type ComputerComponent = 
  | CPUComponent
  | GPUComponent
  | RAMComponent
  | MotherboardComponent
  | PSUComponent
  | CaseComponent
  | CoolerComponent
  | StorageComponent;

// Component type as string literals
export type ComponentType = 
  | 'cpu'
  | 'gpu'
  | 'ram'
  | 'motherboard'
  | 'psu'
  | 'case'
  | 'cooler'
  | 'storage';

// Compatibility information
export interface CompatibilityInfo {
  compatible: boolean;
  issues?: string[];
  warnings?: string[];
  notes?: string;
}

// Component filters
export interface ComponentFilters {
  type?: ComponentType | ComponentType[];
  brand?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Component creation/update payload
export interface ComponentInput {
  name: string;
  type: ComponentType;
  brand: string;
  model: string;
  price: number;
  image?: string;
  specifications: ComponentSpecification[];
  status?: 'active' | 'inactive' | 'discontinued';
}

// API response types
export interface ComponentResponse {
  success: boolean;
  data?: ComputerComponent | ComputerComponent[];
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Helper types
export type ComponentMap = {
  [K in ComponentType]?: ComputerComponent;
};

export type ComponentByType<T extends ComponentType> = Extract<ComputerComponent, { type: T }>;