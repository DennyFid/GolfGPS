import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G, Defs, RadialGradient, Stop, LinearGradient } from 'react-native-svg';
import { GPSCoordinates, GreenPoints } from '../../types';

interface MapVisualizationProps {
  width: number;
  height: number;
  greenPoints: GreenPoints;
  userLocation: GPSCoordinates | null;
  isRoundWatch?: boolean;
}

// Distance helper using Haversine formula
export const getDistanceYards = (
  coord1: GPSCoordinates | null,
  coord2: GPSCoordinates | null
): number | null => {
  if (!coord1 || !coord2) return null;
  
  const R = 6371000; // Earth's radius in meters
  const lat1 = (coord1.latitude * Math.PI) / 180;
  const lat2 = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = R * c;

  return Math.round(distanceMeters * 1.09361); // convert to yards
};

export const MapVisualization: React.FC<MapVisualizationProps> = ({
  width,
  height,
  greenPoints,
  userLocation,
  isRoundWatch = false,
}) => {
  const { front, center, back } = greenPoints;
  const isMapped = front || center || back;

  // Let's establish visual positions in pixels
  // If points are mapped, we dynamically calculate positions.
  // Otherwise, we draw a generic mockup/unmapped state.
  
  let userX = width / 2;
  let userY = height - 40;
  let frontX = width / 2;
  let frontY = height * 0.6;
  let centerX = width / 2;
  let centerY = height * 0.45;
  let backX = width / 2;
  let backY = height * 0.3;

  const distF = getDistanceYards(userLocation, front);
  const distC = getDistanceYards(userLocation, center);
  const distB = getDistanceYards(userLocation, back);

  if (isMapped && userLocation) {
    // We map latitude & longitude values to SVG grid coordinates
    // We find min/max values to scale dynamically
    const coordsList = [userLocation, front, center, back].filter((c): c is GPSCoordinates => !!c);
    
    const lats = coordsList.map(c => c.latitude);
    const lons = coordsList.map(c => c.longitude);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    
    const latDiff = maxLat - minLat || 0.0001;
    const lonDiff = maxLon - minLon || 0.0001;
    
    // Add 20% padding around the boundaries
    const latPadding = latDiff * 0.3;
    const lonPadding = lonDiff * 0.3;
    
    const scaleLat = (lat: number) => {
      // Latitude increases upwards, SVG Y increases downwards
      const norm = (lat - (minLat - latPadding)) / (latDiff + 2 * latPadding);
      return height - norm * height;
    };
    
    const scaleLon = (lon: number) => {
      const norm = (lon - (minLon - lonPadding)) / (lonDiff + 2 * lonPadding);
      return norm * width;
    };

    userX = scaleLon(userLocation.longitude);
    userY = scaleLat(userLocation.latitude);
    
    if (front) {
      frontX = scaleLon(front.longitude);
      frontY = scaleLat(front.latitude);
    }
    if (center) {
      centerX = scaleLon(center.longitude);
      centerY = scaleLat(center.latitude);
    }
    if (back) {
      backX = scaleLon(back.longitude);
      backY = scaleLat(back.latitude);
    }
  }

  // Draw helper to check watch boundary constraints
  const clipPathId = isRoundWatch ? "watch-clip" : undefined;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} style={styles.svg}>
        <Defs>
          {/* Green Gradient */}
          <RadialGradient id="greenGrad" cx="50%" cy="50%" rx="40%" ry="40%">
            <Stop offset="0%" stopColor="#4ADE80" stopOpacity={0.9} />
            <Stop offset="70%" stopColor="#22C55E" stopOpacity={0.8} />
            <Stop offset="100%" stopColor="#15803D" stopOpacity={0.7} />
          </RadialGradient>
          
          {/* Fringe Gradient */}
          <RadialGradient id="fringeGrad" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor="#22C55E" stopOpacity={0.2} />
            <Stop offset="90%" stopColor="#166534" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#14532D" stopOpacity={0.6} />
          </RadialGradient>

          {/* Sand Trap Gradient */}
          <LinearGradient id="sandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FEF08A" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#CA8A04" stopOpacity={0.9} />
          </LinearGradient>

          {/* Watch Face Circular Clip */}
          {isRoundWatch && (
            <Svg.ClipPath id="watch-clip">
              <Circle cx={width / 2} cy={height / 2} r={width / 2 - 4} />
            </Svg.ClipPath>
          )}
        </Defs>

        <G clipPath={clipPathId ? `url(#${clipPathId})` : undefined}>
          {/* Deep Green Rough Background */}
          <Path
            d={`M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`}
            fill="#052E16"
          />

          {/* Golf Green Outline / Fringe */}
          <Path
            d={`M ${centerX - 50} ${centerY} 
                C ${centerX - 55} ${centerY - 45}, ${centerX + 55} ${centerY - 55}, ${centerX + 50} ${centerY} 
                C ${centerX + 45} ${centerY + 45}, ${centerX - 45} ${centerY + 45}, ${centerX - 50} ${centerY} Z`}
            fill="url(#fringeGrad)"
            stroke="#166534"
            strokeWidth={2}
          />

          {/* Golf Green Body */}
          <Path
            d={`M ${centerX - 40} ${centerY} 
                C ${centerX - 45} ${centerY - 35}, ${centerX + 45} ${centerY - 45}, ${centerX + 40} ${centerY} 
                C ${centerX + 35} ${centerY + 35}, ${centerX - 35} ${centerY + 35}, ${centerX - 40} ${centerY} Z`}
            fill="url(#greenGrad)"
            stroke="#15803D"
            strokeWidth={1}
          />

          {/* Sand Trap / Bunker (Aesthetics) */}
          <Path
            d={`M ${centerX + 45} ${centerY + 10}
                C ${centerX + 65} ${centerY}, ${centerX + 60} ${centerY + 30}, ${centerX + 50} ${centerY + 25}
                C ${centerX + 40} ${centerY + 20}, ${centerX + 35} ${centerY + 15}, ${centerX + 45} ${centerY + 10} Z`}
            fill="url(#sandGrad)"
          />

          {/* If NOT mapped, show message */}
          {!isMapped && (
            <G>
              <SvgText
                x={width / 2}
                y={centerY}
                fill="#ffffff"
                fontSize={12}
                fontWeight="bold"
                textAnchor="middle"
                opacity={0.8}
              >
                UNMAPPED GREEN
              </SvgText>
              <SvgText
                x={width / 2}
                y={centerY + 15}
                fill="#86EFAC"
                fontSize={10}
                textAnchor="middle"
                opacity={0.7}
              >
                Use Phone/Watch to Map
              </SvgText>
            </G>
          )}

          {/* Distance Lines from user to pins */}
          {isMapped && userLocation && (
            <G>
              {front && (
                <>
                  <Line
                    x1={userX}
                    y1={userY}
                    x2={frontX}
                    y2={frontY}
                    stroke="#EF4444"
                    strokeWidth={1.5}
                    strokeDasharray="4, 4"
                    opacity={0.8}
                  />
                  {distF !== null && (
                    <G>
                      <Circle cx={(userX + frontX) / 2} cy={(userY + frontY) / 2} r={10} fill="#EF4444" />
                      <SvgText
                        x={(userX + frontX) / 2}
                        y={(userY + frontY) / 2 + 3}
                        fill="#ffffff"
                        fontSize={8}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {distF}
                      </SvgText>
                    </G>
                  )}
                </>
              )}

              {center && (
                <>
                  <Line
                    x1={userX}
                    y1={userY}
                    x2={centerX}
                    y2={centerY}
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    strokeDasharray="4, 4"
                    opacity={0.8}
                  />
                  {distC !== null && (
                    <G>
                      <Circle cx={(userX + centerX) / 2} cy={(userY + centerY) / 2} r={10} fill="#F59E0B" />
                      <SvgText
                        x={(userX + centerX) / 2}
                        y={(userY + centerY) / 2 + 3}
                        fill="#ffffff"
                        fontSize={8}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {distC}
                      </SvgText>
                    </G>
                  )}
                </>
              )}

              {back && (
                <>
                  <Line
                    x1={userX}
                    y1={userY}
                    x2={backX}
                    y2={backY}
                    stroke="#3B82F6"
                    strokeWidth={1.5}
                    strokeDasharray="4, 4"
                    opacity={0.8}
                  />
                  {distB !== null && (
                    <G>
                      <Circle cx={(userX + backX) / 2} cy={(userY + backY) / 2} r={10} fill="#3B82F6" />
                      <SvgText
                        x={(userX + backX) / 2}
                        y={(userY + backY) / 2 + 3}
                        fill="#ffffff"
                        fontSize={8}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {distB}
                      </SvgText>
                    </G>
                  )}
                </>
              )}
            </G>
          )}

          {/* Mapped Points Pins */}
          {front && (
            <G>
              <Circle cx={frontX} cy={frontY} r={8} fill="#EF4444" stroke="#ffffff" strokeWidth={1.5} />
              <SvgText x={frontX} y={frontY + 3} fill="#ffffff" fontSize={8} fontWeight="bold" textAnchor="middle">
                F
              </SvgText>
            </G>
          )}

          {center && (
            <G>
              <Circle cx={centerX} cy={centerY} r={8} fill="#F59E0B" stroke="#ffffff" strokeWidth={1.5} />
              <SvgText x={centerX} y={centerY + 3} fill="#ffffff" fontSize={8} fontWeight="bold" textAnchor="middle">
                C
              </SvgText>
            </G>
          )}

          {back && (
            <G>
              <Circle cx={backX} cy={backY} r={8} fill="#3B82F6" stroke="#ffffff" strokeWidth={1.5} />
              <SvgText x={backX} y={backY + 3} fill="#ffffff" fontSize={8} fontWeight="bold" textAnchor="middle">
                B
              </SvgText>
            </G>
          )}

          {/* User Marker (Pulsing Golf Ball) */}
          {userLocation && (
            <G>
              {/* Pulsing Beacon Ring */}
              <Circle
                cx={userX}
                cy={userY}
                r={12}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={1.5}
                opacity={0.4}
              />
              {/* Golf Ball */}
              <Circle
                cx={userX}
                cy={userY}
                r={6}
                fill="#ffffff"
                stroke="#1E3A8A"
                strokeWidth={1.5}
              />
            </G>
          )}
        </G>
      </Svg>

      {/* Accuracy overlay if visible */}
      {userLocation && (
        <View style={styles.accuracyOverlay}>
          <Text style={styles.accuracyText}>
            GPS ±{userLocation.accuracy.toFixed(1)}m
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  svg: {
    backgroundColor: '#052E16',
  },
  accuracyOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  accuracyText: {
    color: '#10B981',
    fontSize: 9,
    fontFamily: 'System',
    fontWeight: '600',
  },
});
