import { Di2Device, WorkoutData } from '../types';

export class Di2Service {
  private device: Di2Device | null = null;
  private isConnected = false;
  private currentGear = { front: 2, rear: 11 }; // Default middle gear
  
  // Mock Shimano Di2 device for development
  async connectToDevice(): Promise<boolean> {
    // Simulate connection delay
    await new Promise<void>(resolve => setTimeout(resolve, 2000));
    
    this.device = {
      id: 'shimano-di2-001',
      name: 'Shimano Di2 Ultegra',
      connected: true,
      batteryLevel: 85,
      frontGears: 2, // Compact crankset
      rearGears: 11 // 11-speed cassette
    };
    
    this.isConnected = true;
    console.log('Connected to Shimano Di2 device');
    return true;
  }
  
  disconnect(): void {
    this.device = null;
    this.isConnected = false;
    console.log('Disconnected from Shimano Di2 device');
  }
  
  isDeviceConnected(): boolean {
    return this.isConnected && this.device !== null;
  }
  
  getDevice(): Di2Device | null {
    return this.device;
  }
  
  getCurrentGear(): { front: number; rear: number } {
    return { ...this.currentGear };
  }
  
  // Automatic shifting algorithm based on target power and cadence
  async autoShift(targetPower: number, currentData: WorkoutData): Promise<void> {
    if (!this.isDeviceConnected()) return;
    
    const { power, cadence, speed } = currentData;
    const targetCadence = 90; // Optimal cadence for most riders
    
    // Calculate gear ratio needed for target power at optimal cadence
    const newGear = this.calculateOptimalGear(targetPower, targetCadence, speed);
    
    // Only shift if gear change is significant
    if (this.shouldShift(newGear)) {
      await this.shiftToGear(newGear);
    }
  }
  
  private calculateOptimalGear(targetPower: number, targetCadence: number, speed: number): { front: number; rear: number } {
    // Simplified gear calculation
    // In reality, this would consider chainring sizes, cassette ratios, wheel circumference, etc.
    
    const powerCadenceRatio = targetPower / targetCadence;
    const speedFactor = speed / 30; // Normalize speed
    
    let frontGear = this.currentGear.front;
    let rearGear = this.currentGear.rear;
    
    // High power needs (threshold/VO2 intervals)
    if (targetPower > 250) {
      frontGear = 2; // Big chainring
      rearGear = Math.max(1, Math.min(8, Math.round(powerCadenceRatio / 4)));
    }
    // Medium power (tempo/endurance)
    else if (targetPower > 150) {
      frontGear = speed > 25 ? 2 : 1;
      rearGear = Math.max(3, Math.min(9, Math.round(powerCadenceRatio / 3)));
    }
    // Low power (recovery/warmup)
    else {
      frontGear = 1; // Small chainring
      rearGear = Math.max(6, Math.min(11, Math.round(powerCadenceRatio / 2)));
    }
    
    return {
      front: Math.max(1, Math.min(frontGear, this.device?.frontGears || 2)),
      rear: Math.max(1, Math.min(rearGear, this.device?.rearGears || 11))
    };
  }
  
  private shouldShift(newGear: { front: number; rear: number }): boolean {
    // Avoid unnecessary shifting
    const frontDiff = Math.abs(newGear.front - this.currentGear.front);
    const rearDiff = Math.abs(newGear.rear - this.currentGear.rear);
    
    // Only shift if change is significant (at least 2 cogs in rear or any front change)
    return frontDiff > 0 || rearDiff >= 2;
  }
  
  private async shiftToGear(gear: { front: number; rear: number }): Promise<void> {
    if (!this.device) return;
    
    console.log(`Shifting to gear: Front ${gear.front}, Rear ${gear.rear}`);
    
    // Simulate shifting delay
    await new Promise<void>(resolve => setTimeout(resolve, 500));
    
    this.currentGear = { ...gear };
    
    // In real implementation, this would send Bluetooth commands to Di2 system
    // Example: await this.sendShiftCommand(gear);
  }
  
  // Manual shifting methods
  async shiftFrontUp(): Promise<void> {
    if (this.currentGear.front < (this.device?.frontGears || 2)) {
      await this.shiftToGear({
        front: this.currentGear.front + 1,
        rear: this.currentGear.rear
      });
    }
  }
  
  async shiftFrontDown(): Promise<void> {
    if (this.currentGear.front > 1) {
      await this.shiftToGear({
        front: this.currentGear.front - 1,
        rear: this.currentGear.rear
      });
    }
  }
  
  async shiftRearUp(): Promise<void> {
    if (this.currentGear.rear < (this.device?.rearGears || 11)) {
      await this.shiftToGear({
        front: this.currentGear.front,
        rear: this.currentGear.rear + 1
      });
    }
  }
  
  async shiftRearDown(): Promise<void> {
    if (this.currentGear.rear > 1) {
      await this.shiftToGear({
        front: this.currentGear.front,
        rear: this.currentGear.rear - 1
      });
    }
  }
  
  getBatteryLevel(): number {
    return this.device?.batteryLevel || 0;
  }
  
  // Get gear ratio for display
  getGearRatio(): number {
    if (!this.device) return 1;
    
    // Simplified gear ratio calculation
    // Front chainrings: 50/34T (compact), Rear: 11-28T cassette
    const frontTeeth = this.currentGear.front === 2 ? 50 : 34;
    const rearTeeth = 11 + (this.currentGear.rear - 1) * 1.5; // Approximate
    
    return Number((frontTeeth / rearTeeth).toFixed(2));
  }
}