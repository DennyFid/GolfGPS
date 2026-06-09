import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, StatusBar } from 'react-native';
import { PhoneMainScreen } from './src/ui/screens/PhoneMainScreen';
import { WatchMainScreen } from './src/ui/screens/WatchMainScreen';
import { StorageService } from './src/data/storage';
import { GolfCourse, GPSCoordinates, GpsSource, SyncStatus } from './src/types';

export default function App() {
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [activeCourse, setActiveCourse] = useState<GolfCourse | null>(null);
  const [currentHole, setCurrentHole] = useState<number>(1);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  
  // Simulator Connection & Settings
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [gpsSource, setGpsSource] = useState<GpsSource>('phone');

  // Simulated GPS Locations
  // Coordinates are centered around Pebble Beach Green 1 (36.5684, -121.9566)
  const [phoneLat, setPhoneLat] = useState<number>(36.5684);
  const [phoneLon, setPhoneLon] = useState<number>(-121.9566);
  const [phoneAcc, setPhoneAcc] = useState<number>(1.2);

  const [watchLat, setWatchLat] = useState<number>(36.5685);
  const [watchLon, setWatchLon] = useState<number>(-121.9567);
  const [watchAcc, setWatchAcc] = useState<number>(4.8);

  // Load courses on mount
  useEffect(() => {
    const init = async () => {
      const allCourses = await StorageService.getCourses();
      setCourses(allCourses);
      const activeId = await StorageService.getActiveCourseId();
      const active = allCourses.find(c => c.id === activeId) || allCourses[0];
      if (active) {
        setActiveCourse(active);
      }
    };
    init();
  }, []);

  // Sync state handler: when course is updated on phone
  const handleUpdateCourse = async (updatedCourse: GolfCourse) => {
    setActiveCourse(updatedCourse);
    
    // Save to storage
    await StorageService.saveCourse(updatedCourse);
    
    // Update courses list
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));

    // Handle sync logic
    if (isConnected) {
      setSyncStatus('syncing');
      setTimeout(() => {
        setSyncStatus('synced');
      }, 1000);
    } else {
      setSyncStatus('needs_sync');
    }
  };

  const handleSelectCourse = async (id: string) => {
    const selected = courses.find(c => c.id === id);
    if (selected) {
      setActiveCourse(selected);
      await StorageService.setActiveCourseId(id);
      
      if (isConnected) {
        setSyncStatus('syncing');
        setTimeout(() => {
          setSyncStatus('synced');
        }, 800);
      } else {
        setSyncStatus('needs_sync');
      }
    }
  };

  const handleCreateCourse = async (name: string) => {
    const newId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newCourse: GolfCourse = {
      id: newId,
      name,
      lastUpdated: Date.now(),
      holes: Array.from({ length: 18 }, (_, i) => ({
        holeNumber: i + 1,
        greenPoints: { front: null, center: null, back: null }
      }))
    };

    const updatedCourses = [...courses, newCourse];
    setCourses(updatedCourses);
    setActiveCourse(newCourse);
    await StorageService.saveCourse(newCourse);
    await StorageService.setActiveCourseId(newId);

    if (isConnected) {
      setSyncStatus('syncing');
      setTimeout(() => {
        setSyncStatus('synced');
      }, 1000);
    } else {
      setSyncStatus('needs_sync');
    }
  };

  const handleSyncManual = () => {
    if (!isConnected) return;
    setSyncStatus('syncing');
    setTimeout(() => {
      setSyncStatus('synced');
    }, 1200);
  };

  // Re-sync if connection toggled back on
  const handleToggleConnection = (connected: boolean) => {
    setIsConnected(connected);
    if (connected && syncStatus === 'needs_sync') {
      setSyncStatus('syncing');
      setTimeout(() => {
        setSyncStatus('synced');
      }, 1000);
    } else if (!connected) {
      setSyncStatus('offline');
    } else {
      setSyncStatus('synced');
    }
  };

  // Pre-set location configurations to test yardages easily
  const setSimPreset = (preset: 'center' | 'front' | 'back' | 'fairway' | 'approach') => {
    // Green center = (36.5684, -121.9566)
    switch (preset) {
      case 'center':
        setPhoneLat(36.5684);
        setPhoneLon(-121.9566);
        setWatchLat(36.5684);
        setWatchLon(-121.9566);
        break;
      case 'front':
        setPhoneLat(36.56835);
        setPhoneLon(-121.95665);
        setWatchLat(36.56835);
        setWatchLon(-121.95665);
        break;
      case 'back':
        setPhoneLat(36.56845);
        setPhoneLon(-121.95655);
        setWatchLat(36.56845);
        setWatchLon(-121.95655);
        break;
      case 'approach':
        setPhoneLat(36.5681);
        setPhoneLon(-121.9569);
        setWatchLat(36.56811);
        setWatchLon(-121.95691);
        break;
      case 'fairway':
        setPhoneLat(36.5670);
        setPhoneLon(-121.9580);
        setWatchLat(36.56702);
        setWatchLon(-121.95802);
        break;
    }
  };

  if (!activeCourse) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Green Mapper Workspace...</Text>
      </View>
    );
  }

  // Construct GPS Coordinate objects
  const phoneCoordinates: GPSCoordinates = {
    latitude: phoneLat,
    longitude: phoneLon,
    accuracy: phoneAcc,
    timestamp: Date.now()
  };

  const watchCoordinates: GPSCoordinates = {
    latitude: watchLat,
    longitude: watchLon,
    accuracy: watchAcc,
    timestamp: Date.now()
  };

  return (
    <ScrollView style={styles.workspace} contentContainerStyle={styles.workspaceContent}>
      <StatusBar barStyle="light-content" />
      
      {/* Workspace Header */}
      <View style={styles.workspaceHeader}>
        <Text style={styles.workspaceTitle}>GOLFGPS WORKSPACE</Text>
        <Text style={styles.workspaceSubtitle}>
          Pixel 6 & Wear OS 4+ Dual Simulation Environment
        </Text>
      </View>

      {/* Simulator Layout */}
      <View style={styles.simulatorGrid}>
        
        {/* PANEL 1: PIXEL 6 SIMULATOR */}
        <View style={styles.simulatorPanel}>
          <Text style={styles.panelLabel}>📱 Google Pixel 6 (Android Phone)</Text>
          <View style={styles.phoneFrame}>
            <View style={styles.phoneBezel}>
              <View style={styles.phoneSpeaker} />
              <View style={styles.phoneCamera} />
              
              {/* Screen Viewport */}
              <View style={styles.phoneScreen}>
                <PhoneMainScreen
                  courses={courses}
                  activeCourse={activeCourse}
                  currentHole={currentHole}
                  setCurrentHole={setCurrentHole}
                  userLocation={phoneCoordinates}
                  syncStatus={syncStatus}
                  onSelectCourse={handleSelectCourse}
                  onCreateCourse={handleCreateCourse}
                  onUpdateCourse={handleUpdateCourse}
                  onSync={handleSyncManual}
                />
              </View>
              
              <View style={styles.phoneHomeIndicator} />
            </View>
          </View>
        </View>

        {/* PANEL 2: WEAR OS SIMULATOR */}
        <View style={styles.simulatorPanel}>
          <Text style={styles.panelLabel}>⌚ Samsung Galaxy Watch (Wear OS 4+)</Text>
          <View style={styles.watchFrame}>
            {/* Watch Bezel / Steel Body */}
            <View style={styles.watchBezel}>
              <View style={styles.watchCrown} />
              <View style={styles.watchButton} />
              
              {/* Watch Screen (Circular) */}
              <View style={styles.watchScreen}>
                <WatchMainScreen
                  activeCourse={activeCourse}
                  currentHole={currentHole}
                  setCurrentHole={setCurrentHole}
                  phoneLocation={phoneCoordinates}
                  watchLocation={watchCoordinates}
                  syncStatus={syncStatus}
                  gpsSource={gpsSource}
                  setGpsSource={setGpsSource}
                  isConnected={isConnected}
                />
              </View>
            </View>
          </View>
          <Text style={styles.watchDisclaimer}>
            💡 Watch sleeps to save AOD power. Tap face to Wake.
          </Text>
        </View>

      </View>

      {/* CONTROL CENTER PANEL */}
      <View style={styles.controlsCard}>
        <Text style={styles.controlsTitle}>⚙️ Simulator Control Center</Text>
        <Text style={styles.controlsHint}>
          Simulate movements, GPS signal strengths, and Bluetooth connectivity on the course.
        </Text>

        <View style={styles.controlGrid}>
          
          {/* Simulated Location Adjusters */}
          <View style={styles.controlCol}>
            <Text style={styles.colTitle}>📍 Simulated User Coordinates</Text>
            
            {/* Latitude Adjuster */}
            <View style={styles.adjusterRow}>
              <Text style={styles.adjusterLabel}>Lat: {phoneLat.toFixed(5)}</Text>
              <View style={styles.adjusterButtons}>
                <TouchableOpacity 
                  style={styles.adjusterBtn} 
                  onPress={() => {
                    setPhoneLat(prev => prev - 0.0001);
                    setWatchLat(prev => prev - 0.0001);
                  }}
                >
                  <Text style={styles.btnText}>- S</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.adjusterBtn} 
                  onPress={() => {
                    setPhoneLat(prev => prev + 0.0001);
                    setWatchLat(prev => prev + 0.0001);
                  }}
                >
                  <Text style={styles.btnText}>+ N</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Longitude Adjuster */}
            <View style={styles.adjusterRow}>
              <Text style={styles.adjusterLabel}>Lon: {phoneLon.toFixed(5)}</Text>
              <View style={styles.adjusterButtons}>
                <TouchableOpacity 
                  style={styles.adjusterBtn} 
                  onPress={() => {
                    setPhoneLon(prev => prev - 0.0001);
                    setWatchLon(prev => prev - 0.0001);
                  }}
                >
                  <Text style={styles.btnText}>- W</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.adjusterBtn} 
                  onPress={() => {
                    setPhoneLon(prev => prev + 0.0001);
                    setWatchLon(prev => prev + 0.0001);
                  }}
                >
                  <Text style={styles.btnText}>+ E</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Presets Grid */}
            <Text style={styles.presetsLabel}>Course Location Presets:</Text>
            <View style={styles.presetsGrid}>
              <TouchableOpacity style={styles.presetBtn} onPress={() => setSimPreset('center')}>
                <Text style={styles.presetText}>Green Center</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => setSimPreset('front')}>
                <Text style={styles.presetText}>Green Front</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => setSimPreset('back')}>
                <Text style={styles.presetText}>Green Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => setSimPreset('approach')}>
                <Text style={styles.presetText}>Approach</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.presetBtn} onPress={() => setSimPreset('fairway')}>
                <Text style={styles.presetText}>Fairway (150y)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Device Settings */}
          <View style={styles.controlCol}>
            <Text style={styles.colTitle}>📶 Connection & GPS Quality</Text>

            {/* Bluetooth Switch */}
            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Bluetooth Link</Text>
                <Text style={styles.switchDesc}>Phone to Watch Sync</Text>
              </View>
              <Switch
                value={isConnected}
                onValueChange={handleToggleConnection}
                trackColor={{ false: '#475569', true: '#10B981' }}
                thumbColor={isConnected ? '#ffffff' : '#94A3B8'}
              />
            </View>

            {/* Accuracy Adjusters */}
            <View style={styles.accuracyGrid}>
              <View style={styles.accuracyCol}>
                <Text style={styles.accuracyLabel}>Phone Accuracy</Text>
                <View style={styles.adjusterButtons}>
                  <TouchableOpacity 
                    style={styles.adjusterBtn} 
                    onPress={() => setPhoneAcc(prev => Math.max(0.5, prev - 0.5))}
                  >
                    <Text style={styles.btnText}>High</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.adjusterBtn} 
                    onPress={() => setPhoneAcc(prev => prev + 1)}
                  >
                    <Text style={styles.btnText}>Low</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.accVal}>±{phoneAcc.toFixed(1)}m</Text>
              </View>

              <View style={styles.accuracyCol}>
                <Text style={styles.accuracyLabel}>Watch Accuracy</Text>
                <View style={styles.adjusterButtons}>
                  <TouchableOpacity 
                    style={styles.adjusterBtn} 
                    onPress={() => setWatchAcc(prev => Math.max(1, prev - 1))}
                  >
                    <Text style={styles.btnText}>High</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.adjusterBtn} 
                    onPress={() => setWatchAcc(prev => prev + 2)}
                  >
                    <Text style={styles.btnText}>Low</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.accVal}>±{watchAcc.toFixed(1)}m</Text>
              </View>
            </View>

            {/* Watch-specific debug indicators */}
            <View style={styles.debugBox}>
              <Text style={styles.debugTitle}>Standalone Watch Testing Info</Text>
              <Text style={styles.debugText}>
                • Disable "Bluetooth Link" to test Standalone watch GPS.
              </Text>
              <Text style={styles.debugText}>
                • In Standalone mode, Watch utilizes its own GPS (Solo) and computes yardages locally using the cached watch coordinates.
              </Text>
            </View>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  workspace: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  workspaceContent: {
    padding: 24,
    alignItems: 'center',
  },
  workspaceHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  workspaceTitle: {
    color: '#10B981',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
  },
  workspaceSubtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  simulatorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 24,
    width: '100%',
    maxWidth: 900,
  },
  simulatorPanel: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  panelLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  // Pixel 6 Bezel Frame
  phoneFrame: {
    width: 320,
    height: 600,
    backgroundColor: '#334155',
    borderRadius: 36,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#475569',
  },
  phoneBezel: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 28,
    padding: 8,
    position: 'relative',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phoneSpeaker: {
    width: 60,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
  },
  phoneCamera: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 2,
    borderColor: '#1E293B',
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    zIndex: 20,
  },
  phoneScreen: {
    flex: 1,
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginTop: 22,
    overflow: 'hidden',
  },
  phoneHomeIndicator: {
    width: 100,
    height: 4,
    backgroundColor: '#64748B',
    borderRadius: 2,
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
  },
  // Samsung Galaxy Watch Frame
  watchFrame: {
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#1E293B',
    position: 'relative',
  },
  watchBezel: {
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#1E293B',
    position: 'relative',
  },
  watchCrown: {
    width: 10,
    height: 20,
    backgroundColor: '#475569',
    position: 'absolute',
    right: -14,
    top: 90,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  watchButton: {
    width: 6,
    height: 16,
    backgroundColor: '#334155',
    position: 'absolute',
    right: -10,
    top: 150,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  watchScreen: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchDisclaimer: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // CONTROL CENTER STYLES
  controlsCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 900,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  controlsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  controlsHint: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 20,
  },
  controlGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  controlCol: {
    flex: 1,
    minWidth: 300,
    marginHorizontal: 10,
    marginVertical: 10,
  },
  colTitle: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6,
  },
  adjusterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  adjusterLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  adjusterButtons: {
    flexDirection: 'row',
  },
  adjusterBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginLeft: 6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  presetsLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  presetBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  switchLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  switchDesc: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  accuracyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accuracyCol: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  accuracyLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  accVal: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 6,
  },
  debugBox: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  debugTitle: {
    color: '#3B82F6',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  debugText: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 13,
    marginBottom: 4,
  },
});
