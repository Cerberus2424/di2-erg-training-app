import { WorkoutSession } from '../types';

export interface GarminActivity {
  activityId: string;
  activityName: string;
  activityType: string;
  startTimeGMT: string;
  duration: number;
  distance: number;
  averageSpeed: number;
  maxSpeed: number;
  averagePower?: number;
  maxPower?: number;
  averageHR?: number;
  maxHR?: number;
  calories: number;
}

export class GarminService {
  private accessToken: string | null = null;
  private isConnected = false;

  async authenticate(): Promise<boolean> {
    // Mock authentication for development
    // In real implementation, this would use Garmin Connect IQ OAuth
    console.log('Garmin Connect authentication started...');
    
    // Simulate authentication delay
    await new Promise<void>(resolve => setTimeout(resolve, 2500));
    
    // Mock successful authentication
    this.accessToken = 'mock_garmin_token_' + Date.now();
    this.isConnected = true;
    
    console.log('Garmin Connect authentication successful');
    return true;
  }

  disconnect(): void {
    this.accessToken = null;
    this.isConnected = false;
    console.log('Disconnected from Garmin Connect');
  }

  isAuthenticated(): boolean {
    return this.isConnected && this.accessToken !== null;
  }

  async uploadActivity(session: WorkoutSession): Promise<string | null> {
    if (!this.isAuthenticated()) {
      console.error('Not authenticated with Garmin Connect');
      return null;
    }

    try {
      const activity = this.convertSessionToGarminActivity(session);
      
      // Mock API call
      console.log('Uploading activity to Garmin Connect...');
      await new Promise<void>(resolve => setTimeout(resolve, 4000));
      
      const activityId = 'garmin_activity_' + Date.now();
      console.log(`Activity uploaded to Garmin Connect with ID: ${activityId}`);
      
      return activityId;
    } catch (error) {
      console.error('Failed to upload to Garmin Connect:', error);
      return null;
    }
  }

  private convertSessionToGarminActivity(session: WorkoutSession): GarminActivity {
    const duration = session.endTime 
      ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
      : 0;

    const avgSpeed = session.distance / (duration / 3600);
    const maxSpeed = Math.max(...session.data.map(d => d.speed));

    return {
      activityId: session.id,
      activityName: `ERG Training: ${session.workoutName}`,
      activityType: 'cycling',
      startTimeGMT: session.startTime.toISOString(),
      duration,
      distance: session.distance * 1000, // Convert km to meters
      averageSpeed: avgSpeed,
      maxSpeed,
      averagePower: session.avgPower,
      maxPower: session.maxPower,
      averageHR: session.avgHeartRate,
      maxHR: session.maxHeartRate,
      calories: session.calories
    };
  }

  async getRecentActivities(limit: number = 10): Promise<GarminActivity[]> {
    if (!this.isAuthenticated()) {
      console.error('Not authenticated with Garmin Connect');
      return [];
    }

    try {
      // Mock API call
      console.log('Fetching recent activities from Garmin Connect...');
      await new Promise<void>(resolve => setTimeout(resolve, 2000));

      // Return mock activities
      const activities: GarminActivity[] = [
        {
          activityId: 'mock_garmin_activity_1',
          activityName: 'Morning Threshold Session',
          activityType: 'cycling',
          startTimeGMT: new Date(Date.now() - 172800000).toISOString(),
          duration: 4200,
          distance: 35000,
          averageSpeed: 30,
          maxSpeed: 45,
          averagePower: 235,
          maxPower: 310,
          averageHR: 162,
          maxHR: 178,
          calories: 865
        }
      ];

      return activities.slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch activities from Garmin Connect:', error);
      return [];
    }
  }

  async syncWithGarminDevices(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      console.error('Not authenticated with Garmin Connect');
      return false;
    }

    try {
      console.log('Syncing with Garmin devices...');
      await new Promise<void>(resolve => setTimeout(resolve, 3000));
      
      console.log('Garmin device sync completed');
      return true;
    } catch (error) {
      console.error('Failed to sync with Garmin devices:', error);
      return false;
    }
  }

  // Generate FIT file data for Garmin devices
  generateFitData(session: WorkoutSession): ArrayBuffer {
    // Mock FIT file generation
    // In real implementation, this would create a proper FIT file using Garmin SDK
    console.log('Generating FIT file data...');
    
    // Create mock binary data
    const mockFitData = new ArrayBuffer(1024);
    const view = new DataView(mockFitData);
    
    // FIT file header (simplified mock)
    view.setUint8(0, 14); // Header size
    view.setUint8(1, 32); // Protocol version
    view.setUint16(2, 2088, true); // Profile version
    view.setUint32(4, mockFitData.byteLength - 14, true); // Data size
    
    // Add activity data timestamp
    const timestamp = Math.floor(session.startTime.getTime() / 1000);
    view.setUint32(8, timestamp, true);
    
    return mockFitData;
  }

  // Upload workout data directly to Garmin Edge devices
  async uploadToGarminDevice(session: WorkoutSession, deviceId?: string): Promise<boolean> {
    if (!this.isAuthenticated()) {
      console.error('Not authenticated with Garmin Connect');
      return false;
    }

    try {
      const fitData = this.generateFitData(session);
      
      console.log(`Uploading workout to Garmin device ${deviceId || 'default'}...`);
      await new Promise<void>(resolve => setTimeout(resolve, 5000));
      
      console.log('Workout uploaded to Garmin device successfully');
      return true;
    } catch (error) {
      console.error('Failed to upload to Garmin device:', error);
      return false;
    }
  }

  // Get training status and metrics from Garmin Connect
  async getTrainingStatus(): Promise<any> {
    if (!this.isAuthenticated()) {
      console.error('Not authenticated with Garmin Connect');
      return null;
    }

    try {
      console.log('Fetching training status from Garmin Connect...');
      await new Promise<void>(resolve => setTimeout(resolve, 1500));
      
      return {
        trainingLoad: 85,
        recoveryTime: 16,
        vo2Max: 52.3,
        functionalThresholdPower: 285,
        lactateThreshold: {
          heartRate: 168,
          pace: '4:32/km'
        },
        trainingEffect: {
          aerobic: 3.2,
          anaerobic: 1.8
        }
      };
    } catch (error) {
      console.error('Failed to fetch training status:', error);
      return null;
    }
  }

  // Schedule structured workouts to Garmin devices
  async scheduleWorkout(workout: any, targetDate: Date): Promise<boolean> {
    if (!this.isAuthenticated()) {
      console.error('Not authenticated with Garmin Connect');
      return false;
    }

    try {
      console.log(`Scheduling workout for ${targetDate.toDateString()}...`);
      await new Promise<void>(resolve => setTimeout(resolve, 2000));
      
      console.log('Workout scheduled successfully');
      return true;
    } catch (error) {
      console.error('Failed to schedule workout:', error);
      return false;
    }
  }
}