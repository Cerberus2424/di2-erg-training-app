import { ErgWorkout, ErgInterval } from '../types';

export class ErgParser {
  static parseErgFile(ergContent: string): ErgWorkout {
    const lines = ergContent.split('\n').map(line => line.trim());
    
    let name = 'Unknown Workout';
    let description = '';
    const intervals: ErgInterval[] = [];
    let totalTime = 0;
    
    // Parse ERG file format
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('[COURSE HEADER]')) {
        // Skip header section
        continue;
      }
      
      if (line.startsWith('NAME=')) {
        name = line.substring(5);
      }
      
      if (line.startsWith('DESCRIPTION=')) {
        description = line.substring(12);
      }
      
      if (line.startsWith('[COURSE DATA]')) {
        // Parse course data section
        i++; // Skip header line
        while (i < lines.length && lines[i]) {
          const dataLine = lines[i].trim();
          if (!dataLine || dataLine.startsWith('[')) break;
          
          const parts = dataLine.split('\t');
          if (parts.length >= 2) {
            const timeMinutes = parseFloat(parts[0]);
            const powerPercent = parseFloat(parts[1]);
            
            if (!isNaN(timeMinutes) && !isNaN(powerPercent)) {
              const duration = timeMinutes * 60; // Convert to seconds
              const targetPower = Math.round(powerPercent * 2.5); // Rough FTP conversion
              
              intervals.push({
                duration,
                targetPower,
                description: this.getPhaseDescription(powerPercent)
              });
              
              totalTime += duration;
            }
          }
          i++;
        }
        break;
      }
    }
    
    // If no intervals found, create a simple workout structure
    if (intervals.length === 0) {
      intervals.push({
        duration: 3600, // 1 hour default
        targetPower: 200, // 200W default
        description: 'Steady state workout'
      });
      totalTime = 3600;
    }
    
    const ftpPercentages = intervals.map(interval => 
      Math.round((interval.targetPower / 250) * 100) // Assume 250W FTP
    );
    
    return {
      name,
      description,
      totalTime,
      intervals,
      ftpPercentages
    };
  }
  
  static parseZwoFile(zwoContent: string): ErgWorkout {
    // Basic Zwift workout (.zwo) parser
    // This is a simplified version - full implementation would use XML parser
    const name = this.extractXmlValue(zwoContent, 'name') || 'Zwift Workout';
    const description = this.extractXmlValue(zwoContent, 'description') || '';
    
    const intervals: ErgInterval[] = [];
    let totalTime = 0;
    
    // Extract workout segments (simplified)
    const segmentMatches = zwoContent.match(/<(?:Warmup|SteadyState|IntervalsT|Cooldown|Ramp)[^>]*>/g);
    
    if (segmentMatches) {
      segmentMatches.forEach(segment => {
        const duration = this.extractAttribute(segment, 'Duration') || '300';
        const power = this.extractAttribute(segment, 'Power') || '0.6';
        
        const durationSec = parseInt(duration);
        const powerFtp = parseFloat(power);
        const targetPower = Math.round(powerFtp * 250); // Assume 250W FTP
        
        intervals.push({
          duration: durationSec,
          targetPower,
          description: this.getPhaseDescription(powerFtp * 100)
        });
        
        totalTime += durationSec;
      });
    }
    
    const ftpPercentages = intervals.map(interval => 
      Math.round((interval.targetPower / 250) * 100)
    );
    
    return {
      name,
      description,
      totalTime,
      intervals,
      ftpPercentages
    };
  }
  
  private static extractXmlValue(xml: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : null;
  }
  
  private static extractAttribute(tag: string, attrName: string): string | null {
    const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
    const match = tag.match(regex);
    return match ? match[1] : null;
  }
  
  private static getPhaseDescription(powerPercent: number): string {
    if (powerPercent < 60) return 'Recovery';
    if (powerPercent < 75) return 'Endurance';
    if (powerPercent < 90) return 'Tempo';
    if (powerPercent < 105) return 'Threshold';
    if (powerPercent < 120) return 'VO2 Max';
    return 'Neuromuscular';
  }
  
  static createSampleWorkout(): ErgWorkout {
    return {
      name: 'Sample ERG Workout',
      description: 'A structured training session with intervals',
      totalTime: 3600, // 1 hour
      intervals: [
        { duration: 600, targetPower: 150, description: 'Warmup' },
        { duration: 300, targetPower: 250, description: 'Threshold' },
        { duration: 180, targetPower: 120, description: 'Recovery' },
        { duration: 300, targetPower: 280, description: 'VO2 Max' },
        { duration: 180, targetPower: 120, description: 'Recovery' },
        { duration: 300, targetPower: 250, description: 'Threshold' },
        { duration: 600, targetPower: 100, description: 'Cooldown' }
      ],
      ftpPercentages: [60, 100, 48, 112, 48, 100, 40]
    };
  }
}