// Simple global storage for training data
// This will persist across API calls within the same deployment

interface TrainingDataEntry {
  id: string;
  data_type: string;
  category: string;
  content: string;
  saved_at: string;
}

// Global storage that persists across API calls
let globalTrainingDataStore: TrainingDataEntry[] = [];

export function addTrainingData(entry: TrainingDataEntry): void {
  globalTrainingDataStore.push(entry);
  console.log(`📚 Added training data. Total entries: ${globalTrainingDataStore.length}`);
}

export function getTrainingData(): TrainingDataEntry[] {
  return [...globalTrainingDataStore]; // Return a copy
}

export function getTrainingDataCount(): number {
  return globalTrainingDataStore.length;
}

export function clearTrainingData(): void {
  globalTrainingDataStore = [];
}