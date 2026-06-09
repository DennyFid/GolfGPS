import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { GolfCourse, GPSCoordinates, GpsSource, SyncStatus } from '../../types';
import { MapVisualization, getDistanceYards } from '../components/MapVisualization';

interface WatchMainScreenProps {
  activeCourse: GolfCourse;
  currentHole: number;
  setCurrentHole: (hole: number) => void;
  phoneLocation: GPSCoordinates | null;
  watchLocation: GPSCoordinates | null;
  syncStatus: SyncStatus;
  gpsSource: GpsSource;
  setGpsSource: (source: GpsSource) => void;
  isConnected: boolean;
}

export const WatchMainScreen: React.FC<WatchMainScreenProps> = ({
  activeCourse,
  currentHole,
  setCurrentHole,
  phoneLocation,
  watchLocation,
  syncStatus,
  gpsSource,
  setGpsSource,
  isConnected,
}) => {
  // Screen States
  const [isAwake, setIsAwake] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [readIndication, setReadIndication] = useState<'unread' | 'read' | null>(null);
  const [sleepTimer, setSleepTimer] = useState<number>(15); // 15s timeout

  // Auto-sleep timer handler when awake
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAwake) {
      setSleepTimer(15);
      interval = setInterval(() => {
        setSleepTimer(prev => {
          if (prev <= 1) {
            setIsAwake(false);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAwake]);

  // Reset timer on user interaction
  const resetSleepTimeout = () => {
    setSleepTimer(15);
  };

  const handleWakeUp = () => {
    setIsAwake(true);
    setReadIndication(null);
  };

  const handleIndicateOff = (readStatus: 'read' | 'unread') => {
    setReadIndication(readStatus);
    // Short delay to show feedback, then turn screen off
    setTimeout(() => {
      setIsAwake(false);
    }, 400);
  };

  // Hole Navigation with Plus (top) and Minus (bottom)
  const handleNextHole = () => {
    resetSleepTimeout();
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
  };

  const handlePrevHole = () => {
    resetSleepTimeout();
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  const activeLocation = gpsSource === 'phone' ? phoneLocation : watchLocation;

  const holeData = activeCourse.holes.find(h => h.holeNumber === currentHole) || {
    holeNumber: currentHole,
    greenPoints: { front: null, center: null, back: null },
  };

  const { front, center, back } = holeData.greenPoints;

  // Distances calculations
  const distF = getDistanceYards(activeLocation, front);
  const distC = getDistanceYards(activeLocation, center);
  const distB = getDistanceYards(activeLocation, back);

  // Sleep State Render
  if (!isAwake) {
    return (
      <TouchableOpacity style={styles.sleepContainer} onPress={handleWakeUp} activeOpacity={0.9}>
        <View style={styles.sleepContent}>
          <Text style={styles.sleepTime}>13:45</Text>
          <Text style={styles.sleepHint}>Tap to Wake</Text>
          {syncStatus === 'needs_sync' && (
            <View style={styles.notificationDot} />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Awake State Render
  return (
    <View style={styles.awakeContainer} onTouchStart={resetSleepTimeout}>
      {/* 1. TOP HOLE NAVIGATION (+) */}
      <TouchableOpacity 
        style={styles.navTopButton} 
        onPress={handleNextHole}
        disabled={currentHole === 18}
      >
        <Text style={[styles.navButtonText, currentHole === 18 && styles.disabledText]}>
          ▲ Plus (+) [H{Math.min(18, currentHole + 1)}]
        </Text>
      </TouchableOpacity>

      {/* Main Watch Face Content */}
      <View style={styles.watchContent}>
        {/* Sync & Connectivity info */}
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {isConnected ? '⚡ Link' : '✖ Solo'}
          </Text>
          <Text style={styles.statusText}>
            Hole {currentHole}
          </Text>
          <Text style={styles.statusText}>
            {gpsSource === 'phone' ? 'Phone GPS' : 'Watch GPS'}
          </Text>
        </View>

        {showMap ? (
          /* View A: SVG Map visualization in circular crop */
          <TouchableOpacity 
            style={styles.mapClickable} 
            onPress={() => { resetSleepTimeout(); setShowMap(false); }}
          >
            <MapVisualization
              width={160}
              height={100}
              greenPoints={holeData.greenPoints}
              userLocation={activeLocation}
              isRoundWatch={true}
            />
            <Text style={styles.toggleText}>Tap for Yards</Text>
          </TouchableOpacity>
        ) : (
          /* View B: Large Yardages readout */
          <TouchableOpacity 
            style={styles.yardageClickable} 
            onPress={() => { resetSleepTimeout(); setShowMap(true); }}
          >
            {/* Yardages grid */}
            <View style={styles.yardageGrid}>
              <View style={styles.yardageRow}>
                <Text style={[styles.yardLetter, { color: '#EF4444' }]}>F</Text>
                <Text style={styles.yardVal}>{distF !== null ? distF : '--'}</Text>
              </View>
              <View style={styles.yardageRowLarge}>
                <Text style={[styles.yardLetterLarge, { color: '#F59E0B' }]}>C</Text>
                <Text style={styles.yardValLarge}>{distC !== null ? distC : '--'}</Text>
              </View>
              <View style={styles.yardageRow}>
                <Text style={[styles.yardLetter, { color: '#3B82F6' }]}>B</Text>
                <Text style={styles.yardVal}>{distB !== null ? distB : '--'}</Text>
              </View>
            </View>
            <Text style={styles.toggleText}>Tap for Map</Text>
          </TouchableOpacity>
        )}

        {/* GPS Source / Bluetooth Toggle Control */}
        <View style={styles.gpsSelectorRow}>
          <TouchableOpacity
            style={[styles.gpsTag, gpsSource === 'watch_standalone' && styles.gpsTagActive]}
            onPress={() => { resetSleepTimeout(); setGpsSource('watch_standalone'); }}
          >
            <Text style={styles.gpsTagText}>Solo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gpsTag, gpsSource === 'phone' && styles.gpsTagActive, !isConnected && styles.gpsTagDisabled]}
            disabled={!isConnected}
            onPress={() => { resetSleepTimeout(); setGpsSource('phone'); }}
          >
            <Text style={styles.gpsTagText}>Phone</Text>
          </TouchableOpacity>
        </View>

        {/* Indication Actions: Off when marked read or not read */}
        <View style={styles.closeActionsRow}>
          <TouchableOpacity 
            style={[
              styles.actionBtn, 
              styles.actionRead,
              readIndication === 'read' && styles.actionFeedback
            ]}
            onPress={() => handleIndicateOff('read')}
          >
            <Text style={styles.actionBtnText}>Read (Off)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.actionBtn, 
              styles.actionUnread,
              readIndication === 'unread' && styles.actionFeedback
            ]}
            onPress={() => handleIndicateOff('unread')}
          >
            <Text style={styles.actionBtnText}>Not Read</Text>
          </TouchableOpacity>
        </View>

        {/* Sleep countdown visual bar */}
        <View style={styles.timerContainer}>
          <View style={[styles.timerBar, { width: `${(sleepTimer / 15) * 100}%` }]} />
        </View>
      </View>

      {/* 2. BOTTOM HOLE NAVIGATION (-) */}
      <TouchableOpacity 
        style={styles.navBottomButton} 
        onPress={handlePrevHole}
        disabled={currentHole === 1}
      >
        <Text style={[styles.navButtonText, currentHole === 1 && styles.disabledText]}>
          ▼ Minus (-) [H{Math.max(1, currentHole - 1)}]
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sleepContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  sleepContent: {
    alignItems: 'center',
  },
  sleepTime: {
    color: '#94A3B8',
    fontSize: 32,
    fontWeight: '300',
  },
  sleepHint: {
    color: '#475569',
    fontSize: 11,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    position: 'absolute',
    top: -12,
  },
  awakeContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#10B981',
    justifyContent: 'space-between',
  },
  navTopButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    zIndex: 10,
  },
  navBottomButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 4,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    zIndex: 10,
  },
  navButtonText: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  disabledText: {
    color: '#475569',
  },
  watchContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  statusText: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '600',
  },
  yardageClickable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    width: '100%',
  },
  mapClickable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  yardageGrid: {
    alignItems: 'center',
    marginVertical: 1,
  },
  yardageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1,
  },
  yardageRowLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 0,
  },
  yardLetter: {
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 6,
  },
  yardVal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  yardLetterLarge: {
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 8,
  },
  yardValLarge: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  toggleText: {
    color: '#475569',
    fontSize: 7,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  gpsSelectorRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  gpsTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginHorizontal: 3,
  },
  gpsTagActive: {
    backgroundColor: '#10B981',
  },
  gpsTagDisabled: {
    opacity: 0.3,
  },
  gpsTagText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '700',
  },
  closeActionsRow: {
    flexDirection: 'row',
    marginTop: 2,
    justifyContent: 'center',
    width: '100%',
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  actionRead: {
    backgroundColor: '#15803D',
  },
  actionUnread: {
    backgroundColor: '#B91C1C',
  },
  actionFeedback: {
    backgroundColor: '#ffffff',
    opacity: 0.8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: 'bold',
  },
  timerContainer: {
    width: 60,
    height: 2,
    backgroundColor: '#334155',
    borderRadius: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  timerBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
  },
});
