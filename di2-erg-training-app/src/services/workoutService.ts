import { ErgWorkout, WorkoutProgress, WorkoutData, WorkoutSession } from '../types';

export class WorkoutService {
  private currentWorkout: ErgWorkout | null = null;
  private workoutSession: WorkoutSession | null = null;
  private startTime: Date | null = null;
  private elapsedTime = 0;
  private currentIntervalIndex = 0;
  private intervalElapsedTime = 0;
  private isRunning = false;
  private progressListeners: ((progress: WorkoutProgress) => void)[] = [];
  private dataListeners: ((data: WorkoutData) => void)[] = [];
  private updateInterval?: ReturnType<typeof setInterval>;
  
  // Current sensor data
  private currentData: WorkoutData = {
    speed: 0,
    cadence: 0,
    power: 0,
    heartRate: 0,
    gear: { front: 2, rear: 8 }
  };
  
  startWorkout(workout: ErgWorkout): void {
    this.currentWorkout = workout;
    this.startTime = new Date();
    this.elapsedTime = 0;
    this.currentIntervalIndex = 0;
    this.intervalElapsedTime = 0;
    this.isRunning = true;
    
    this.workoutSession = {
      id: `workout_${Date.now()}`,
      workoutName: workout.name,
      startTime: this.startTime,
      avgPower: 0,
      maxPower: 0,
      avgHeartRate: 0,
      maxHeartRate: 0,
      avgCadence: 0,
      distance: 0,
      calories: 0,
      data: []
    };
    
    this.startProgressTracking();
    console.log(`Started workout: ${workout.name}`);
  }
  
  pauseWorkout(): void {
    this.isRunning = false;
    this.stopProgressTracking();
    console.log('Workout paused');
  }
  
  resumeWorkout(): void {
    this.isRunning = true;
    this.startProgressTracking();
    console.log('Workout resumed');
  }
  
  stopWorkout(): WorkoutSession | null {
    this.isRunning = false;
    this.stopProgressTracking();
    
    if (this.workoutSession) {
      this.workoutSession.endTime = new Date();
      this.calculateSessionSummary();
      console.log('Workout completed');
    }
    
    const session = this.workoutSession;
    this.reset();
    return session;
  }
  
  private reset(): void {
    this.currentWorkout = null;
    this.workoutSession = null;
    this.startTime = null;
    this.elapsedTime = 0;
    this.currentIntervalIndex = 0;
    this.intervalElapsedTime = 0;
  }
  
  updateSensorData(data: Partial<WorkoutData>): void {
    this.currentData = { ...this.currentData, ...data };
    
    if (this.workoutSession && this.isRunning) {
      this.workoutSession.data.push({ ...this.currentData });
    }
    
    // Notify data listeners
    this.dataListeners.forEach(callback => callback(this.currentData));
  }
  
  getCurrentProgress(): WorkoutProgress | null {
    if (!this.currentWorkout) return null;
    
    const currentInterval = this.currentWorkout.intervals[this.currentIntervalIndex];
    if (!currentInterval) return null;
    
    const totalTime = this.currentWorkout.totalTime;
    const remainingTime = totalTime - this.elapsedTime;
    
    return {
      currentInterval: this.currentIntervalIndex,
      elapsedTime: this.elapsedTime,
      remainingTime,
      phase: this.getCurrentPhase(),
      targetPower: currentInterval.targetPower,
      actualPower: this.currentData.power
    };
  }
  
  private getCurrentPhase(): 'warmup' | 'main' | 'cooldown' | 'interval' | 'recovery' {
    if (!this.currentWorkout) return 'main';
    
    const totalIntervals = this.currentWorkout.intervals.length;
    const currentIndex = this.currentIntervalIndex;
    
    if (currentIndex === 0) return 'warmup';
    if (currentIndex === totalIntervals - 1) return 'cooldown';
    
    const currentInterval = this.currentWorkout.intervals[currentIndex];
    if (currentInterval.targetPower < 150) return 'recovery';
    if (currentInterval.targetPower > 250) return 'interval';
    
    return 'main';
  }
  
  private startProgressTracking(): void {
    this.updateInterval = setInterval(() => {
      if (!this.isRunning || !this.currentWorkout) return;
      
      this.elapsedTime++;
      this.intervalElapsedTime++;
      
      // Check if current interval is complete
      const currentInterval = this.currentWorkout.intervals[this.currentIntervalIndex];
      if (currentInterval && this.intervalElapsedTime >= currentInterval.duration) {
        this.moveToNextInterval();
      }
      
      // Notify progress listeners
      const progress = this.getCurrentProgress();
      if (progress) {
        this.progressListeners.forEach(callback => callback(progress));
      }
    }, 1000);
  }
  
  private stopProgressTracking(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }
  
  private moveToNextInterval(): void {
    if (!this.currentWorkout) return;
    
    this.currentIntervalIndex++;
    this.intervalElapsedTime = 0;
    
    if (this.currentIntervalIndex >= this.currentWorkout.intervals.length) {
      // Workout complete
      this.stopWorkout();
    } else {
      console.log(`Moving to interval ${this.currentIntervalIndex + 1}`);
    }
  }
  
  private calculateSessionSummary(): void {
    if (!this.workoutSession || this.workoutSession.data.length === 0) return;
    
    const data = this.workoutSession.data;
    const totalData = data.length;
    
    // Calculate averages
    const totalPower = data.reduce((sum, d) => sum + d.power, 0);
    const totalHeartRate = data.reduce((sum, d) => sum + d.heartRate, 0);
    const totalCadence = data.reduce((sum, d) => sum + d.cadence, 0);
    const totalSpeed = data.reduce((sum, d) => sum + d.speed, 0);
    
    this.workoutSession.avgPower = Math.round(totalPower / totalData);
    this.workoutSession.avgHeartRate = Math.round(totalHeartRate / totalData);
    this.workoutSession.avgCadence = Math.round(totalCadence / totalData);
    
    // Calculate maximums
    this.workoutSession.maxPower = Math.max(...data.map(d => d.power));
    this.workoutSession.maxHeartRate = Math.max(...data.map(d => d.heartRate));
    
    // Calculate distance (rough estimate)
    const avgSpeed = totalSpeed / totalData;
    const durationHours = this.elapsedTime / 3600;
    this.workoutSession.distance = Number((avgSpeed * durationHours).toFixed(2));
    
    // Calculate calories (rough estimate: 1 watt ≈ 0.01-0.02 calories/second)
    this.workoutSession.calories = Math.round(
      (this.workoutSession.avgPower * this.elapsedTime * 0.015) / 4.184
    );
  }
  
  addProgressListener(callback: (progress: WorkoutProgress) => void): void {
    this.progressListeners.push(callback);
  }
  
  removeProgressListener(callback: (progress: WorkoutProgress) => void): void {
    const index = this.progressListeners.indexOf(callback);
    if (index > -1) {
      this.progressListeners.splice(index, 1);
    }
  }
  
  addDataListener(callback: (data: WorkoutData) => void): void {
    this.dataListeners.push(callback);
  }
  
  removeDataListener(callback: (data: WorkoutData) => void): void {
    const index = this.dataListeners.indexOf(callback);
    if (index > -1) {
      this.dataListeners.splice(index, 1);
    }
  }
  
  isWorkoutRunning(): boolean {
    return this.isRunning;
  }
  
  getCurrentWorkout(): ErgWorkout | null {
    return this.currentWorkout;
  }
  
  getCurrentData(): WorkoutData {
    return { ...this.currentData };
  }
  
  getWorkoutSession(): WorkoutSession | null {
    return this.workoutSession;
  }
  
  // Simulate power meter data based on workout target
  simulatePowerMeter(targetPower: number): void {
    // Simulate realistic power variation around target
    const variation = (Math.random() - 0.5) * 20; // ±10W variation
    const powerAccuracy = 0.9 + Math.random() * 0.2; // 90-110% accuracy
    
    const simulatedPower = Math.round(targetPower * powerAccuracy + variation);
    const simulatedCadence = 85 + Math.round((Math.random() - 0.5) * 20); // 75-95 rpm
    const simulatedSpeed = Math.max(0, 25 + (simulatedPower - 200) / 10); // Speed based on power
    
    this.updateSensorData({
      power: Math.max(0, simulatedPower),
      cadence: Math.max(0, simulatedCadence),
      speed: Number(simulatedSpeed.toFixed(1))
    });
  }
}