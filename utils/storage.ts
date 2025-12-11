
import { DeviceAnalysis } from '../types';

const STORAGE_KEY = 'accessitwin_devices_v1';

// Limit storage to 5 devices to prevent QuotaExceededError with base64 images
const MAX_DEVICES = 5;

export const saveDevice = (analysis: DeviceAnalysis, imageSrc: string): void => {
  try {
    const devices = getSavedDevices();
    
    // Create new entry
    const newDevice: DeviceAnalysis = {
      ...analysis,
      id: analysis.id || crypto.randomUUID(),
      timestamp: Date.now(),
      originalImage: imageSrc
    };

    // Add to beginning, limit array size
    const updatedDevices = [newDevice, ...devices].slice(0, MAX_DEVICES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDevices));
  } catch (e) {
    console.error("Storage failed (likely quota exceeded):", e);
    // Fallback: Try saving without the image if full
    try {
        // Implementation for advanced error handling could go here
        alert("Storage full. Could not save this device to your cabinet.");
    } catch (inner) {}
  }
};

export const getSavedDevices = (): DeviceAnalysis[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load devices", e);
    return [];
  }
};

export const deleteDevice = (id: string): DeviceAnalysis[] => {
  const devices = getSavedDevices();
  const updated = devices.filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
