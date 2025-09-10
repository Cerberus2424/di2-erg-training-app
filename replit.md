# Overview

The Di2 ERG Training App is a React Native mobile application prototype designed for cyclists using Shimano Di2 electronic shifting systems during ERG (electronically resistance generated) workouts. The current implementation provides a foundational structure with simulated hardware connections and mock integrations. The app demonstrates automatic shifting logic, real-time workout tracking, and integration frameworks for fitness platforms.

**Current Status**: Development prototype with simulated hardware - not ready for real-world outdoor cycling use.

**Recent Changes** (September 10, 2025):
- Created complete React Native Android app structure
- Implemented ERG file parsing with support for .erg and .zwo formats
- Built comprehensive workout tracking service with interval management
- Added simulated Shimano Di2 automatic shifting logic
- Created real-time workout display with cycling metrics
- Established Strava and Garmin Connect integration foundations
- Set up Metro development server for testing

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React Native 0.81.1 with TypeScript for cross-platform mobile development
- **Navigation**: Single-screen architecture centered around `WorkoutScreen` component
- **State Management**: React hooks-based state management with local component state
- **UI Components**: Native React Native components with custom styling
- **Safe Area Handling**: React Native Safe Area Context for proper device boundary handling

## Backend Architecture
- **Service Layer Pattern**: Modular service architecture with dedicated services for different hardware integrations
- **Core Services**:
  - `Di2Service`: Shimano Di2 drivetrain control and automatic shifting algorithms
  - `HeartRateService`: Heart rate monitor connectivity and data streaming
  - `WorkoutService`: ERG workout execution, progress tracking, and session management
  - `StravaService`: Strava API integration for activity uploads
  - `GarminService`: Garmin Connect integration for activity synchronization

## Data Management
- **File System**: React Native FS for ERG workout file parsing and local storage
- **Workout Data**: In-memory workout session tracking with real-time data collection
- **ERG Parser**: Custom parser utility for standard ERG workout file format processing

## Hardware Integration
- **Bluetooth Low Energy**: React Native BLE PLX for wireless device communication
- **Device Permissions**: React Native Permissions for accessing Bluetooth and location services
- **Automatic Shifting Algorithm**: Power-based gear selection logic optimizing for target cadence ranges

## Real-time Data Processing
- **Sensor Data Streaming**: Continuous monitoring of power, cadence, heart rate, and speed metrics
- **Workout Progress Tracking**: Interval-based progression with phase detection (warmup, main, cooldown)
- **Gear Optimization**: Dynamic front/rear chainring selection based on power targets and rider efficiency

# External Dependencies

## Hardware Integrations
- **Shimano Di2 System**: Bluetooth connectivity for electronic drivetrain control
- **Heart Rate Monitors**: ANT+ and Bluetooth heart rate sensor support
- **Power Meters**: Integration with cycling power measurement devices

## Fitness Platform APIs
- **Strava API**: OAuth2 authentication and activity upload functionality
- **Garmin Connect API**: Activity synchronization and data export capabilities

## React Native Ecosystem
- **BLE Communication**: `react-native-ble-plx` for Bluetooth Low Energy device management
- **Device Information**: `react-native-device-info` for hardware capability detection
- **File System Access**: `react-native-fs` for ERG file reading and workout data storage
- **Vector Icons**: `react-native-vector-icons` for UI iconography

## Development Tools
- **Code Quality**: ESLint with React Native configuration and Prettier for code formatting
- **Testing**: Jest testing framework with React Test Renderer
- **Build System**: Metro bundler with Babel transformation pipeline
- **Platform Support**: iOS and Android build configurations with native module linking