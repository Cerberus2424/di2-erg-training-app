// Data types for Di2 ERG training app

export interface WorkoutData {
  speed: number; // km/h
  cadence: number; // rpm
  power: number; // watts
  heartRate: number; // bpm
  gear: {
    front: number;
    rear: number;
  };
}

export interface ErgInterval {
  duration: number; // seconds
  targetPower: number; // watts
  targetCadence?: number; // rpm
  description?: string;
}

export interface ErgWorkout {
  name: string;
  description: string;
  totalTime: number; // seconds
  intervals: ErgInterval[];
  ftpPercentages: number[];
}

export interface WorkoutProgress {
  currentInterval: number;
  elapsedTime: number;
  remainingTime: number;
  phase: 'warmup' | 'main' | 'cooldown' | 'interval' | 'recovery';
  targetPower: number;
  actualPower: number;
}

export interface Di2Device {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
  frontGears: number;
  rearGears: number;
}

export interface HeartRateDevice {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
}

export interface PowerMeterDevice {
  id: string;
  name: string;
  connected: boolean;
  batteryLevel?: number;
}

export interface WorkoutSession {
  id: string;
  workoutName: string;
  startTime: Date;
  endTime?: Date;
  avgPower: number;
  maxPower: number;
  avgHeartRate: number;
  maxHeartRate: number;
  avgCadence: number;
  distance: number;
  calories: number;
  data: WorkoutData[];
}