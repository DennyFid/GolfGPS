import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Alert } from 'react-native';
import { GolfCourse, GPSCoordinates, SyncStatus } from '../../types';
import { MapVisualization, getDistanceYards } from '../components/MapVisualization';
import { NavigationContainer } from '@react-navigation/native';

interface PhoneMainScreenProps {
  courses: GolfCourse[];
  activeCourse: GolfCourse;
  currentHole: number;
  setCurrentHole: (hole: number) => void;
  userLocation: GPSCoordinates | null;
  syncStatus: SyncStatus;
  onSelectCourse: (id: string) => void;
  onCreateCourse: (name: string) => void;
  onUpdateCourse: (course: GolfCourse) => void;
  onSync: () => void;
}

export const PhoneMainScreen: React.FC<PhoneMainScreenProps> = ({
  courses,
  activeCourse,
  currentHole,
  setCurrentHole,
  userLocation,
  syncStatus,
  onSelectCourse,
  onCreateCourse,
  onUpdateCourse,
  onSync,
}) => {
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  
  const holeData = activeCourse.holes.find(h => h.holeNumber === currentHole) || {
    holeNumber: currentHole,
    greenPoints: { front: null, center: null, back: null },
  };

  const { front, center, back } = holeData.greenPoints;

  // Handle marking points using the phone's live GPS
  const handleMarkPoint = (point: 'front' | 'center' | 'back') => {
    if (!userLocation) {
      Alert.alert('Error', 'No GPS signal available. Please enable or simulate GPS.');
      return;
    }

    const updatedHoles = activeCourse.holes.map(h => {
      if (h.holeNumber === currentHole) {
        return {
          ...h,
          greenPoints: {
            ...h.greenPoints,
            [point]: { ...userLocation },
          },
        };
      }
      return h;
    });

    const updatedCourse: GolfCourse = {
      ...activeCourse,
      holes: updatedHoles,
      lastUpdated: Date.now(),
    };

    onUpdateCourse(updatedCourse);
  };

  const handleClearPoint = (point: 'front' | 'center' | 'back') => {
    const updatedHoles = activeCourse.holes.map(h => {
      if (h.holeNumber === currentHole) {
        return {
          ...h,
          greenPoints: {
            ...h.greenPoints,
            [point]: null,
          },
        };
      }
      return h;
    });

    const updatedCourse: GolfCourse = {
      ...activeCourse,
      holes: updatedHoles,
      lastUpdated: Date.now(),
    };

    onUpdateCourse(updatedCourse);
  };

  // Plus (increment hole) and Minus (decrement hole)
  const handleNextHole = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
    }
  };

  const handlePrevHole = () => {
    if (currentHole > 1) {
      setCurrentHole(currentHole - 1);
    }
  };

  const handleCreateCourseSubmit = () => {
    if (!newCourseName.trim()) return;
    onCreateCourse(newCourseName.trim());
    setNewCourseName('');
    setCourseModalVisible(false);
  };

  // Distance calculations
  const distF = getDistanceYards(userLocation, front);
  const distC = getDistanceYards(userLocation, center);
  const distB = getDistanceYards(userLocation, back);

  return (
    <View style={styles.container}>
      {/* 1. TOP HOLE NAVIGATION (+) */}
      <TouchableOpacity 
        style={styles.navTopButton} 
        onPress={handleNextHole}
        disabled={currentHole === 18}
      >
        <Text style={[styles.navButtonText, currentHole === 18 && styles.disabledText]}>
          ▲ Plus (+) Hole [Hole {Math.min(18, currentHole + 1)}]
        </Text>
      </TouchableOpacity>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* App Title & Sync bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.appTitle}>🟢 Green Mapper</Text>
            <Text style={styles.courseSubtitle}>{activeCourse.name}</Text>
          </View>
          <View style={styles.syncContainer}>
            <Text style={[
              styles.syncText,
              syncStatus === 'synced' && styles.syncTextSynced,
              syncStatus === 'syncing' && styles.syncTextSyncing,
              syncStatus === 'needs_sync' && styles.syncTextNeedsSync,
            ]}>
              {syncStatus === 'synced' && '● Watch Synced'}
              {syncStatus === 'syncing' && '↻ Syncing...'}
              {syncStatus === 'needs_sync' && '▲ Needs Sync'}
              {syncStatus === 'offline' && '○ Watch Offline'}
            </Text>
            {syncStatus === 'needs_sync' && (
              <TouchableOpacity style={styles.syncBtn} onPress={onSync}>
                <Text style={styles.syncBtnText}>Sync</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {/* Course Selector card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.sectionTitle}>Course Management</Text>
              <TouchableOpacity 
                style={styles.actionLink} 
                onPress={() => setCourseModalVisible(true)}
              >
                <Text style={styles.actionLinkText}>+ New Course</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.courseListInline}>
              {courses.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.courseTag,
                    c.id === activeCourse.id && styles.courseTagActive
                  ]}
                  onPress={() => onSelectCourse(c.id)}
                >
                  <Text style={[
                    styles.courseTagText,
                    c.id === activeCourse.id && styles.courseTagTextActive
                  ]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Hole Selector and Status info */}
          <View style={styles.card}>
            <View style={styles.holeHeader}>
              <Text style={styles.holeNumberText}>Hole {currentHole}</Text>
              <Text style={styles.parText}>Handicap yardage assistant</Text>
            </View>
            
            {/* Distances Display */}
            <View style={styles.distancesRow}>
              <View style={[styles.distanceBox, { borderColor: '#EF4444' }]}>
                <Text style={styles.distanceLabel}>Front</Text>
                <Text style={[styles.distanceVal, { color: '#EF4444' }]}>
                  {distF !== null ? `${distF} yd` : '--'}
                </Text>
              </View>
              <View style={[styles.distanceBox, { borderColor: '#F59E0B' }]}>
                <Text style={styles.distanceLabel}>Center</Text>
                <Text style={[styles.distanceVal, { color: '#F59E0B' }]}>
                  {distC !== null ? `${distC} yd` : '--'}
                </Text>
              </View>
              <View style={[styles.distanceBox, { borderColor: '#3B82F6' }]}>
                <Text style={styles.distanceLabel}>Back</Text>
                <Text style={[styles.distanceVal, { color: '#3B82F6' }]}>
                  {distB !== null ? `${distB} yd` : '--'}
                </Text>
              </View>
            </View>
          </View>

          {/* Map Section */}
          <View style={[styles.card, styles.mapCard]}>
            <Text style={styles.mapTitle}>Live Visual Map</Text>
            <View style={styles.mapWrapper}>
              <MapVisualization
                width={270}
                height={180}
                greenPoints={holeData.greenPoints}
                userLocation={userLocation}
              />
            </View>
          </View>

          {/* Mapping Controls Card */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Green Mapping Controls</Text>
            <Text style={styles.cardInstruction}>
              Walk to each location on the green and press the mark button.
            </Text>

            {/* FRONT POINT */}
            <View style={styles.pointRow}>
              <View style={styles.pointInfo}>
                <Text style={[styles.pointLabel, { color: '#EF4444' }]}>■ Front Point (F)</Text>
                <Text style={styles.pointCoords}>
                  {front 
                    ? `${front.latitude.toFixed(6)}, ${front.longitude.toFixed(6)}`
                    : 'Not Mapped'}
                </Text>
              </View>
              <View style={styles.pointActions}>
                <TouchableOpacity 
                  style={[styles.markBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => handleMarkPoint('front')}
                >
                  <Text style={styles.btnText}>Mark F</Text>
                </TouchableOpacity>
                {front && (
                  <TouchableOpacity 
                    style={styles.clearBtn}
                    onPress={() => handleClearPoint('front')}
                  >
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* CENTER POINT */}
            <View style={styles.pointRow}>
              <View style={styles.pointInfo}>
                <Text style={[styles.pointLabel, { color: '#F59E0B' }]}>■ Center Point (C)</Text>
                <Text style={styles.pointCoords}>
                  {center 
                    ? `${center.latitude.toFixed(6)}, ${center.longitude.toFixed(6)}`
                    : 'Not Mapped'}
                </Text>
              </View>
              <View style={styles.pointActions}>
                <TouchableOpacity 
                  style={[styles.markBtn, { backgroundColor: '#F59E0B' }]}
                  onPress={() => handleMarkPoint('center')}
                >
                  <Text style={styles.btnText}>Mark C</Text>
                </TouchableOpacity>
                {center && (
                  <TouchableOpacity 
                    style={styles.clearBtn}
                    onPress={() => handleClearPoint('center')}
                  >
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* BACK POINT */}
            <View style={styles.pointRow}>
              <View style={styles.pointInfo}>
                <Text style={[styles.pointLabel, { color: '#3B82F6' }]}>■ Back Point (B)</Text>
                <Text style={styles.pointCoords}>
                  {back 
                    ? `${back.latitude.toFixed(6)}, ${back.longitude.toFixed(6)}`
                    : 'Not Mapped'}
                </Text>
              </View>
              <View style={styles.pointActions}>
                <TouchableOpacity 
                  style={[styles.markBtn, { backgroundColor: '#3B82F6' }]}
                  onPress={() => handleMarkPoint('back')}
                >
                  <Text style={styles.btnText}>Mark B</Text>
                </TouchableOpacity>
                {back && (
                  <TouchableOpacity 
                    style={styles.clearBtn}
                    onPress={() => handleClearPoint('back')}
                  >
                    <Text style={styles.clearBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* 2. BOTTOM HOLE NAVIGATION (-) */}
      <TouchableOpacity 
        style={styles.navBottomButton} 
        onPress={handlePrevHole}
        disabled={currentHole === 1}
      >
        <Text style={[styles.navButtonText, currentHole === 1 && styles.disabledText]}>
          ▼ Minus (-) Hole [Hole {Math.max(1, currentHole - 1)}]
        </Text>
      </TouchableOpacity>

      {/* Modal for creating a new course */}
      <Modal
        visible={courseModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCourseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentCard}>
            <Text style={styles.modalTitle}>Add Golf Course</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter course name"
              placeholderTextColor="#999"
              value={newCourseName}
              onChangeText={setNewCourseName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => setCourseModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]} 
                onPress={handleCreateCourseSubmit}
              >
                <Text style={styles.btnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  navTopButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  navBottomButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  navButtonText: {
    color: '#10B981',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  disabledText: {
    color: '#475569',
  },
  content: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  courseSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  syncContainer: {
    alignItems: 'flex-end',
  },
  syncText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  syncTextSynced: {
    color: '#10B981',
  },
  syncTextSyncing: {
    color: '#3B82F6',
  },
  syncTextNeedsSync: {
    color: '#F59E0B',
  },
  syncBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 2,
  },
  syncBtnText: {
    color: '#0F172A',
    fontSize: 9,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionLink: {
    padding: 2,
  },
  actionLinkText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  courseListInline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  courseTag: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  courseTagActive: {
    backgroundColor: '#10B981',
  },
  courseTagText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  courseTagTextActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  holeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  holeNumberText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  parText: {
    color: '#64748B',
    fontSize: 10,
  },
  distancesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
    marginHorizontal: 3,
    backgroundColor: '#1E293B',
  },
  distanceLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  distanceVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  mapCard: {
    alignItems: 'center',
  },
  mapTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  mapWrapper: {
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardInstruction: {
    color: '#64748B',
    fontSize: 10,
    marginBottom: 8,
  },
  pointRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  pointInfo: {
    flex: 1,
  },
  pointLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  pointCoords: {
    color: '#64748B',
    fontSize: 9,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  pointActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  clearBtn: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContentCard: {
    width: '80%',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1E293B',
    color: '#ffffff',
    borderRadius: 6,
    padding: 8,
    marginBottom: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelBtn: {
    backgroundColor: '#334155',
  },
  saveBtn: {
    backgroundColor: '#10B981',
  },
});
