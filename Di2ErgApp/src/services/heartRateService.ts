import { HeartRateDevice } from '../types';

export class HeartRateService {
  private device: HeartRateDevice | null = null;
  private isConnected = false;
  private currentHeartRate = 0;
  private listeners: ((heartRate: number) => void)[] = [];
  private simulationInterval?: ReturnType<typeof setInterval>;
  
  async connectToDevice(): Promise<boolean> {
    // Simulate connection delay
    await new Promise<void>(resolve => setTimeout(resolve, 1500));
    
    this.device = {
      id: 'hr-belt-001',
      name: 'Heart Rate Monitor',
      connected: true,
      batteryLevel: 92
    };
    
    this.isConnected = true;
    this.startHeartRateSimulation();
    console.log('Connected to Heart Rate Monitor');
    return true;
  }
  
  disconnect(): void {
    this.device = null;
    this.isConnected = false;
    this.stopHeartRateSimulation();
    console.log('Disconnected from Heart Rate Monitor');
  }
  
  isDeviceConnected(): boolean {
    return this.isConnected && this.device !== null;
  }
  
  getDevice(): HeartRateDevice | null {
    return this.device;
  }
  
  getCurrentHeartRate(): number {
    return this.currentHeartRate;
  }
  
  addHeartRateListener(callback: (heartRate: number) => void): void {
    this.listeners.push(callback);
  }
  
  removeHeartRateListener(callback: (heartRate: number) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  private startHeartRateSimulation(): void {
    let baseHeartRate = 65; // Resting HR
    let trend = 0;
    
    this.simulationInterval = setInterval(() => {
      // Simulate realistic heart rate variation
      const variation = (Math.random() - 0.5) * 10;
      trend += (Math.random() - 0.5) * 2;
      trend = Math.max(-5, Math.min(5, trend));
      
      this.currentHeartRate = Math.round(
        Math.max(50, Math.min(200, baseHeartRate + trend + variation))
      );
      
      // Notify listeners
      this.listeners.forEach(callback => callback(this.currentHeartRate));
    }, 1000);
  }
  
  private stopHeartRateSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = undefined;
    }
  }
  
  // Simulate heart rate response to workout intensity
  simulateWorkoutResponse(targetPower: number, currentPower: number): void {
    if (!this.isConnected) return;
    
    // Calculate target heart rate based on power zones
    let targetHR = 65; // Base resting HR
    
    if (targetPower > 250) {
      targetHR = 170; // Threshold/VO2 zone
    } else if (targetPower > 200) {
      targetHR = 155; // Tempo zone
    } else if (targetPower > 150) {
      targetHR = 140; // Endurance zone
    } else {
      targetHR = 120; // Recovery zone
    }
    
    // Gradually adjust current HR towards target
    const difference = targetHR - this.currentHeartRate;
    const adjustment = Math.sign(difference) * Math.min(Math.abs(difference), 3);
    this.currentHeartRate = Math.round(this.currentHeartRate + adjustment);
    
    // Add some realism based on power accuracy
    const powerAccuracy = Math.abs(currentPower - targetPower) / targetPower;
    if (powerAccuracy > 0.1) {
      // HR responds to power overshoots/undershoots
      this.currentHeartRate += Math.round((Math.random() - 0.5) * 8);
    }
    
    // Keep HR in realistic bounds
    this.currentHeartRate = Math.max(50, Math.min(200, this.currentHeartRate));
  }
  
  getBatteryLevel(): number {
    return this.device?.batteryLevel || 0;
  }
  
  getHeartRateZone(heartRate: number): { zone: number; name: string; color: string } {
    // Heart rate zones based on max HR of 190 (age-dependent in real app)
    const maxHR = 190;
    const percentage = (heartRate / maxHR) * 100;
    
    if (percentage < 60) {
      return { zone: 1, name: 'Recovery', color: '#gray' };
    } else if (percentage < 70) {
      return { zone: 2, name: 'Aerobic Base', color: '#blue' };
    } else if (percentage < 80) {
      return { zone: 3, name: 'Aerobic', color: '#green' };
    } else if (percentage < 90) {
      return { zone: 4, name: 'Threshold', color: '#orange' };
    } else {
      return { zone: 5, name: 'VO2 Max', color: '#red' };
    }
  }
}