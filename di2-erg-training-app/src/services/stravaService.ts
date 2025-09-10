import { WorkoutSession } from '../types';

export interface StravaActivity {
  id: string;
  name: string;
  type: 'Ride';
  start_date: string;
  elapsed_time: number;
  distance: number;
  average_speed: number;
  average_watts?: number;
  max_watts?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  kilojoules?: number;
  device_watts: boolean;
}

export class StravaService {
  private accessToken: string | null = null;
  private isConnected = false;

  async authenticate(): Promise<boolean> {
    // Mock authentication for development
    // In real implementation, this would use OAuth2 flow
    console.log('Strava authentication started...');
    
    // Simulate authentication delay
    await new Promise<void>(resolve => setTimeout(resolve, 2000));
    
    // Mock successful authentication
    this.accessToken = 'mock_strava_token_' + Date.now();
    this.isConnected = true;
    
    console.log('Strava authentication successful');
    return true;
  }

  disconnect(): void {
    this.accessToken = null;
    this.isConnected = false;
    console.log('Disconnected from Strava');
  }

  isAuthenticated(): boolean {
    return this.isConnected && this.accessToken !== null;
  }

  async uploadActivity(session: WorkoutSession): Promise<string | null> {
    if (!this.isAuthenticated()) {
      console.error('Not authenticated with Strava');
      return null;
    }

    try {
      const activity = this.convertSessionToStravaActivity(session);
      
      // Mock API call
      console.log('Uploading activity to Strava...');
      await new Promise<void>(resolve => setTimeout(resolve, 3000));
      
      const activityId = 'strava_activity_' + Date.now();
      console.log(`Activity uploaded to Strava with ID: ${activityId}`);
      
      return activityId;
    } catch (error) {
      console.error('Failed to upload to Strava:', error);
      return null;
    }
  }

  private convertSessionToStravaActivity(session: WorkoutSession): StravaActivity {
    const duration = session.endTime 
      ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
      : 0;

    return {
      id: session.id,
      name: `ERG Workout: ${session.workoutName}`,
      type: 'Ride',
      start_date: session.startTime.toISOString(),
      elapsed_time: duration,
      distance: session.distance * 1000, // Convert km to meters for Strava
      average_speed: session.distance / (duration / 3600), // km/h
      average_watts: session.avgPower,
      max_watts: session.maxPower,
      average_heartrate: session.avgHeartRate,
      max_heartrate: session.maxHeartRate,
      kilojoules: Math.round(session.avgPower * duration / 1000),
      device_watts: true
    };
  }

  async getRecentActivities(limit: number = 10): Promise<StravaActivity[]> {
    if (!this.isAuthenticated()) {
      console.error('Not authenticated with Strava');
      return [];
    }

    try {
      // Mock API call
      console.log('Fetching recent activities from Strava...');
      await new Promise<void>(resolve => setTimeout(resolve, 1500));

      // Return mock activities
      const activities: StravaActivity[] = [
        {
          id: 'mock_activity_1',
          name: 'Morning ERG Session',
          type: 'Ride',
          start_date: new Date(Date.now() - 86400000).toISOString(),
          elapsed_time: 3600,
          distance: 30000,
          average_speed: 30,
          average_watts: 220,
          max_watts: 280,
          average_heartrate: 155,
          max_heartrate: 175,
          kilojoules: 792,
          device_watts: true
        }
      ];

      return activities.slice(0, limit);
    } catch (error) {
      console.error('Failed to fetch activities from Strava:', error);
      return [];
    }
  }

  async updateActivity(activityId: string, updates: Partial<StravaActivity>): Promise<boolean> {
    if (!this.isAuthenticated()) {
      console.error('Not authenticated with Strava');
      return false;
    }

    try {
      console.log(`Updating Strava activity ${activityId}...`);
      await new Promise<void>(resolve => setTimeout(resolve, 1000));
      
      console.log('Strava activity updated successfully');
      return true;
    } catch (error) {
      console.error('Failed to update Strava activity:', error);
      return false;
    }
  }

  // Convert workout data to TCX format for upload
  generateTcxData(session: WorkoutSession): string {
    const startTime = session.startTime.toISOString();
    const duration = session.endTime 
      ? Math.floor((session.endTime.getTime() - session.startTime.getTime()) / 1000)
      : 0;

    let trackPoints = '';
    session.data.forEach((data, index) => {
      const time = new Date(session.startTime.getTime() + index * 1000).toISOString();
      trackPoints += `
        <Trackpoint>
          <Time>${time}</Time>
          <HeartRateBpm><Value>${data.heartRate}</Value></HeartRateBpm>
          <Cadence>${data.cadence}</Cadence>
          <Extensions>
            <TPX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
              <Watts>${data.power}</Watts>
              <Speed>${data.speed / 3.6}</Speed>
            </TPX>
          </Extensions>
        </Trackpoint>`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>${startTime}</Id>
      <Lap StartTime="${startTime}">
        <TotalTimeSeconds>${duration}</TotalTimeSeconds>
        <DistanceMeters>${session.distance * 1000}</DistanceMeters>
        <MaximumSpeed>${Math.max(...session.data.map(d => d.speed)) / 3.6}</MaximumSpeed>
        <Calories>${session.calories}</Calories>
        <AverageHeartRateBpm><Value>${session.avgHeartRate}</Value></AverageHeartRateBpm>
        <MaximumHeartRateBpm><Value>${session.maxHeartRate}</Value></MaximumHeartRateBpm>
        <Intensity>Active</Intensity>
        <Cadence>${session.avgCadence}</Cadence>
        <TriggerMethod>Manual</TriggerMethod>
        <Track>${trackPoints}
        </Track>
        <Extensions>
          <LX xmlns="http://www.garmin.com/xmlschemas/ActivityExtension/v2">
            <AvgWatts>${session.avgPower}</AvgWatts>
            <MaxWatts>${session.maxPower}</MaxWatts>
          </LX>
        </Extensions>
      </Lap>
      <Creator xsi:type="Device_t" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
        <Name>Di2ErgApp</Name>
        <UnitId>0</UnitId>
        <ProductID>0</ProductID>
        <Version>
          <VersionMajor>1</VersionMajor>
          <VersionMinor>0</VersionMinor>
        </Version>
      </Creator>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;
  }
}