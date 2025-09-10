import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { WorkoutService } from '../services/workoutService';
import { Di2Service } from '../services/di2Service';
import { HeartRateService } from '../services/heartRateService';
import { ErgParser } from '../utils/ergParser';
import { WorkoutProgress, WorkoutData, ErgWorkout } from '../types';

const { width, height } = Dimensions.get('window');

interface WorkoutScreenProps {
  navigation?: any;
}

export const WorkoutScreen: React.FC<WorkoutScreenProps> = ({ navigation }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [workoutProgress, setWorkoutProgress] = useState<WorkoutProgress | null>(null);
  const [currentData, setCurrentData] = useState<WorkoutData>({
    speed: 0,
    cadence: 0,
    power: 0,
    heartRate: 0,
    gear: { front: 2, rear: 8 }
  });
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<ErgWorkout | null>(null);

  // Services
  const [workoutService] = useState(new WorkoutService());
  const [di2Service] = useState(new Di2Service());
  const [heartRateService] = useState(new HeartRateService());

  useEffect(() => {
    initializeServices();
    loadSampleWorkout();

    return () => {
      workoutService.stopWorkout();
      di2Service.disconnect();
      heartRateService.disconnect();
    };
  }, []);

  useEffect(() => {
    // Set up listeners
    const progressListener = (progress: WorkoutProgress) => {
      setWorkoutProgress(progress);
      
      // Trigger automatic shifting
      if (isConnected && progress.targetPower !== currentData.power) {
        di2Service.autoShift(progress.targetPower, currentData);
      }
      
      // Simulate heart rate response
      heartRateService.simulateWorkoutResponse(progress.targetPower, progress.actualPower);
      
      // Simulate power meter data
      workoutService.simulatePowerMeter(progress.targetPower);
    };

    const dataListener = (data: WorkoutData) => {
      setCurrentData(data);
    };

    workoutService.addProgressListener(progressListener);
    workoutService.addDataListener(dataListener);

    return () => {
      workoutService.removeProgressListener(progressListener);
      workoutService.removeDataListener(dataListener);
    };
  }, [isConnected, currentData]);

  const initializeServices = async () => {
    try {
      Alert.alert('Connecting', 'Connecting to devices...');
      
      const [di2Connected, hrConnected] = await Promise.all([
        di2Service.connectToDevice(),
        heartRateService.connectToDevice()
      ]);

      if (di2Connected && hrConnected) {
        setIsConnected(true);
        Alert.alert('Success', 'All devices connected successfully!');
      } else {
        Alert.alert('Warning', 'Some devices failed to connect');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to devices');
      console.error('Connection error:', error);
    }
  };

  const loadSampleWorkout = () => {
    const sampleWorkout = ErgParser.createSampleWorkout();
    setCurrentWorkout(sampleWorkout);
  };

  const startWorkout = () => {
    if (!currentWorkout) {
      Alert.alert('Error', 'No workout loaded');
      return;
    }

    if (!isConnected) {
      Alert.alert('Warning', 'Devices not connected. Continue anyway?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {
          workoutService.startWorkout(currentWorkout);
          setIsWorkoutRunning(true);
        }}
      ]);
      return;
    }

    workoutService.startWorkout(currentWorkout);
    setIsWorkoutRunning(true);
  };

  const pauseWorkout = () => {
    workoutService.pauseWorkout();
    setIsWorkoutRunning(false);
  };

  const resumeWorkout = () => {
    workoutService.resumeWorkout();
    setIsWorkoutRunning(true);
  };

  const stopWorkout = () => {
    Alert.alert('Stop Workout', 'Are you sure you want to stop the workout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: () => {
        const session = workoutService.stopWorkout();
        setIsWorkoutRunning(false);
        setWorkoutProgress(null);
        
        if (session) {
          Alert.alert('Workout Complete', 
            `Average Power: ${session.avgPower}W\nAverage HR: ${session.avgHeartRate} bpm\nCalories: ${session.calories}`
          );
        }
      }}
    ]);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = (phase: string): string => {
    switch (phase) {
      case 'warmup': return '#FFA500';
      case 'interval': return '#FF4500';
      case 'recovery': return '#32CD32';
      case 'cooldown': return '#87CEEB';
      default: return '#4169E1';
    }
  };

  const getCurrentInterval = () => {
    if (!currentWorkout || !workoutProgress) return null;
    return currentWorkout.intervals[workoutProgress.currentInterval];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Di2 ERG Trainer</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#32CD32' : '#FF4500' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Workout Info */}
      {currentWorkout && (
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutName}>{currentWorkout.name}</Text>
          <Text style={styles.workoutDescription}>{currentWorkout.description}</Text>
        </View>
      )}

      {/* Main Data Display */}
      <View style={styles.dataContainer}>
        {/* Power */}
        <View style={styles.dataItem}>
          <Text style={styles.dataLabel}>Power</Text>
          <Text style={styles.dataValueLarge}>{currentData.power}</Text>
          <Text style={styles.dataUnit}>watts</Text>
          {workoutProgress && (
            <Text style={styles.targetValue}>Target: {workoutProgress.targetPower}W</Text>
          )}
        </View>

        {/* Heart Rate */}
        <View style={styles.dataItem}>
          <Text style={styles.dataLabel}>Heart Rate</Text>
          <Text style={styles.dataValueLarge}>{currentData.heartRate}</Text>
          <Text style={styles.dataUnit}>bpm</Text>
        </View>
      </View>

      {/* Secondary Data */}
      <View style={styles.secondaryData}>
        <View style={styles.smallDataItem}>
          <Text style={styles.smallDataLabel}>Speed</Text>
          <Text style={styles.smallDataValue}>{currentData.speed.toFixed(1)}</Text>
          <Text style={styles.smallDataUnit}>km/h</Text>
        </View>

        <View style={styles.smallDataItem}>
          <Text style={styles.smallDataLabel}>Cadence</Text>
          <Text style={styles.smallDataValue}>{currentData.cadence}</Text>
          <Text style={styles.smallDataUnit}>rpm</Text>
        </View>

        <View style={styles.smallDataItem}>
          <Text style={styles.smallDataLabel}>Gear</Text>
          <Text style={styles.smallDataValue}>
            {currentData.gear.front}-{currentData.gear.rear}
          </Text>
          <Text style={styles.smallDataUnit}>ratio</Text>
        </View>
      </View>

      {/* Workout Progress */}
      {workoutProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.phaseInfo}>
            <Text style={[styles.phaseText, { color: getPhaseColor(workoutProgress.phase) }]}>
              {workoutProgress.phase.toUpperCase()}
            </Text>
            <Text style={styles.intervalText}>
              Interval {workoutProgress.currentInterval + 1} of {currentWorkout?.intervals.length}
            </Text>
          </View>

          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Elapsed</Text>
            <Text style={styles.timeValue}>{formatTime(workoutProgress.elapsedTime)}</Text>
          </View>

          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Remaining</Text>
            <Text style={styles.timeValue}>{formatTime(workoutProgress.remainingTime)}</Text>
          </View>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        {!isWorkoutRunning ? (
          <TouchableOpacity 
            style={[styles.controlButton, styles.startButton]} 
            onPress={startWorkout}
          >
            <Text style={styles.buttonText}>Start Workout</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.runningControls}>
            <TouchableOpacity 
              style={[styles.controlButton, styles.pauseButton]} 
              onPress={pauseWorkout}
            >
              <Text style={styles.buttonText}>Pause</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.controlButton, styles.stopButton]} 
              onPress={stopWorkout}
            >
              <Text style={styles.buttonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 14,
  },
  workoutInfo: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  workoutDescription: {
    fontSize: 14,
    color: '#CCC',
  },
  dataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  dataItem: {
    alignItems: 'center',
    flex: 1,
  },
  dataLabel: {
    fontSize: 16,
    color: '#CCC',
    marginBottom: 5,
  },
  dataValueLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  dataUnit: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 5,
  },
  targetValue: {
    fontSize: 12,
    color: '#FFA500',
    marginTop: 5,
  },
  secondaryData: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  smallDataItem: {
    alignItems: 'center',
    flex: 1,
  },
  smallDataLabel: {
    fontSize: 12,
    color: '#CCC',
    marginBottom: 3,
  },
  smallDataValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  smallDataUnit: {
    fontSize: 10,
    color: '#CCC',
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
  },
  phaseInfo: {
    alignItems: 'center',
    marginBottom: 15,
  },
  phaseText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  intervalText: {
    fontSize: 14,
    color: '#CCC',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeLabel: {
    fontSize: 14,
    color: '#CCC',
  },
  timeValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: 'bold',
  },
  controlsContainer: {
    marginTop: 'auto',
  },
  runningControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  startButton: {
    backgroundColor: '#32CD32',
  },
  pauseButton: {
    backgroundColor: '#FFA500',
  },
  stopButton: {
    backgroundColor: '#FF4500',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
});