
export enum ControlType {
  BUTTON = 'BUTTON',
  KNOB = 'KNOB',
  SWITCH = 'SWITCH',
  DISPLAY = 'DISPLAY'
}

export enum ControlCategory {
  PRIMARY = 'PRIMARY', // Happy path actions (Start, Stop, Power)
  SECONDARY = 'SECONDARY', // Configuration (Temp, Speed)
  ADVANCED = 'ADVANCED', // Rare settings
  DANGER = 'DANGER' // Reset, Delete, Self-Destruct
}

export interface DeviceControl {
  id: string;
  label: string; // The accessible name
  type: ControlType;
  description: string; // Physical description for context (e.g., "Top right red button")
  category: ControlCategory;
  detailText: string; // Step-by-step instructions (e.g. "Step 1: Turn dial. Step 2: Press Start.")
}

export interface DeviceAnalysis {
  id?: string; // UUID for storage
  timestamp?: number; // For sorting
  deviceName: string;
  summary: string;
  safetyWarning?: string; // Critical warnings (e.g. "Hot Surface", "High Voltage")
  controls: DeviceControl[];
  originalImage?: string; // Base64 string for recalling the visual
}

export type AppStatus = 'IDLE' | 'ANALYZING' | 'SUCCESS' | 'ERROR' | 'LIVE';

export type Language = 'en' | 'zh' | 'es';
export type Theme = 'bright' | 'eye-care';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface UserFeedback {
  rating: number; // 1-5
  comment: string;
  timestamp: string;
}
