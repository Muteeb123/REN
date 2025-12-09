import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,

  Animated,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive scaling functions
const scale = (size) => {
  const baseWidth = 375;
  const scaleFactor = SCREEN_WIDTH / baseWidth;
  const normalizedSize = size * scaleFactor;
  return Math.round(normalizedSize);
};

const verticalScale = (size) => {
  const baseHeight = 812;
  const scaleFactor = SCREEN_HEIGHT / baseHeight;
  const normalizedSize = size * scaleFactor;
  return Math.round(normalizedSize);
};

const moderateScale = (size, factor = 0.5) => {
  return size + (scale(size) - size) * factor;
};

// Consistent color scheme
const colors = {
  primary: "#FFFFFF",
  secondary: "#52ACD7",
  textDark: "#1A1B1E",
  textLight: "#6E6E6E",
  bubbleLight: "#F2F2F2",
  inputBackground: "#F8F8F8",
  borderLight: "#E8E8E8",
  background: "#AEC6CF ",
  accent: "#DCE6CC",
  card: "#FFFFFF",
  shadow: "rgba(0, 0, 0, 0.08)",
};

export default function MeditationSession() {
  const navigation = useNavigation();
  const route = useRoute();
  const { session, durationOptions = [2, 3, 4, 5, "Custom"] } = route.params || {};

  const [selectedDuration, setSelectedDuration] = useState(2);
  const [isBreathing, setIsBreathing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [sessionActive, setSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Breathing animation
  useEffect(() => {
    if (isBreathing && sessionActive && !isPaused) {
      // Main breathing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.3,
            duration: 4000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Subtle pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Wave animation for the audio line
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scaleAnim.stopAnimation();
      pulseAnim.stopAnimation();
      waveAnim.stopAnimation();
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isBreathing, sessionActive, isPaused]);

  // Timer effect
  useEffect(() => {
    if (sessionActive && !isPaused && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [sessionActive, isPaused, timeLeft]);

  const startSession = () => {
    setSessionActive(true);
    setIsBreathing(true);
    setIsPaused(false);
    const durationInSeconds = selectedDuration * 60;
    setTimeLeft(durationInSeconds);
  };

  const pauseSession = () => {
    setIsPaused(true);
    setIsBreathing(false);
  };

  const resumeSession = () => {
    setIsPaused(false);
    setIsBreathing(true);
  };

  const resetSession = () => {
    setIsPaused(false);
    setIsBreathing(true);
    const durationInSeconds = selectedDuration * 60;
    setTimeLeft(durationInSeconds);
    scaleAnim.stopAnimation();
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
  };

  const handleSessionComplete = () => {
    setSessionActive(false);
    setIsBreathing(false);
    setIsPaused(false);
    clearInterval(timerRef.current);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDurationSelect = (duration) => {
    if (duration === "Custom") {
      setSelectedDuration(5);
      return;
    }
    setSelectedDuration(duration);
    if (!sessionActive) {
      setTimeLeft(duration * 60);
    }
  };

  const sessionTitle = session?.title || "Deep Breath Dynamics";

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.content}>
        {/* Session Info - Only show when session is not active */}
        {!sessionActive && (
          <Animated.View
            style={[
              styles.sessionInfo,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                }],
              }
            ]}
          >
            <Text style={styles.sessionTitle}>{sessionTitle}</Text>
          </Animated.View>
        )}

        {/* Breathing Circle */}
        <Animated.View
          style={[
            styles.breathingContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            }
          ]}
        >
          <View style={styles.breathingCircleContainer}>
            {/* Outer glow effect */}
            <Animated.View
              style={[
                styles.breathingGlow,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: isBreathing ? 0.2 : 0,
                }
              ]}
            />

            {/* Main breathing circle */}
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: scaleAnim }],
                  backgroundColor: isBreathing ? colors.secondary : colors.accent,
                },
              ]}
            />

            {/* Inner circle with timer */}
            <Animated.View
              style={[
                styles.breathingCircleInner,
                {
                  transform: [{ scale: pulseAnim }],
                }
              ]}
            >
              {sessionActive ? (
                <View style={styles.timerContainer}>
                  <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
                  <Text style={styles.timerLabel}>
                    {isPaused ? "PAUSED" : "REMAINING"}
                  </Text>
                </View>
              ) : (
                <View style={styles.readyContainer}>
                  <Ionicons
                    name="play"
                    size={moderateScale(40)}
                    color={colors.secondary}
                  />
                  <Text style={styles.readyText}>Ready</Text>
                </View>
              )}
            </Animated.View>
          </View>


        </Animated.View>

        {/* Duration Selection - Only show when session is not active */}
        {!sessionActive && (
          <Animated.View
            style={[
              styles.durationSection,
              {
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                }],
              }
            ]}
          >
            <Text style={styles.durationTitle}>Select Duration</Text>
            <View style={styles.durationGrid}>
              {durationOptions.map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationButton,
                    selectedDuration === duration && styles.durationButtonSelected,
                    duration === "Custom" && styles.customButton,
                  ]}
                  onPress={() => handleDurationSelect(duration)}
                >
                  <Text style={[
                    styles.durationButtonText,
                    selectedDuration === duration && styles.durationButtonTextSelected,
                  ]}>
                    {duration === "Custom" ? "Custom" : `${duration} min`}
                  </Text>
                  {selectedDuration === duration && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark" size={moderateScale(16)} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Control Buttons - Positioned at bottom */}
        <Animated.View
          style={[
            styles.controls,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            }
          ]}
        >
          {!sessionActive ? (
            <TouchableOpacity
              style={[
                styles.startButton,
                !selectedDuration && styles.startButtonDisabled
              ]}
              onPress={startSession}
              disabled={!selectedDuration}
            >
              <Text style={styles.startButtonText}>Begin Meditation</Text>
              <Ionicons
                name="play"
                size={moderateScale(20)}
                color={colors.primary}
                style={styles.startButtonIcon}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.sessionControls}>
              {/* Reset Button */}
              <TouchableOpacity style={[styles.controlButton, styles.resetButton]} onPress={resetSession}>
                <Ionicons name="refresh" size={moderateScale(18)} color={colors.textDark} />
                <Text style={[styles.controlButtonText, styles.resetButtonText]}>Reset</Text>
              </TouchableOpacity>

              {/* Pause/Resume Button (Primary) */}
              <TouchableOpacity
                style={[styles.controlButton, styles.pauseButton]}
                onPress={isPaused ? resumeSession : pauseSession}
              >
                <Ionicons
                  name={isPaused ? "play" : "pause"}
                  size={moderateScale(20)}
                  color={colors.primary}
                />
                <Text style={[styles.controlButtonText, styles.pauseButtonText]}>
                  {isPaused ? "Resume" : "Pause"}
                </Text>
              </TouchableOpacity>

              {/* Stop Button */}
              <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={handleSessionComplete}>
                <Ionicons name="stop" size={moderateScale(18)} color={"#D64545"} />
                <Text style={[styles.controlButtonText, styles.stopButtonText]}>End</Text>
              </TouchableOpacity>
            </View>

          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#C7E3FF",
    paddingTop: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: moderateScale(20),
    paddingTop: verticalScale(20),
    paddingBottom: verticalScale(20),
    justifyContent: 'space-between',
  },
  sessionInfo: {
    alignItems: 'center',
    marginBottom: verticalScale(20),
    paddingHorizontal: moderateScale(10),
  },
  sessionTitle: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  breathingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: verticalScale(10),
  },
  breathingCircleContainer: {
    width: moderateScale(220),
    height: moderateScale(220),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: verticalScale(40),
  },
  breathingGlow: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: moderateScale(132),
    backgroundColor: colors.secondary,
  },
  breathingCircle: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(110),
    position: 'absolute',
    opacity: 0.25,
  },
  breathingCircleInner: {
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: moderateScale(32),
    fontWeight: '800',
    color: colors.textDark,
    letterSpacing: 1,
  },
  timerLabel: {
    fontSize: moderateScale(12),
    color: colors.textLight,
    fontWeight: '600',
    marginTop: verticalScale(4),
    letterSpacing: 0.5,
  },
  readyContainer: {
    alignItems: 'center',
  },
  readyText: {
    fontSize: moderateScale(14),
    color: colors.textLight,
    marginTop: verticalScale(8),
    fontWeight: '500',
  },
  // Audio Wave Styles
  audioWaveContainer: {
    alignItems: 'center',
    marginTop: verticalScale(20),
  },
  audioWaveLine: {
    width: moderateScale(200),
    height: verticalScale(4),
    backgroundColor: colors.bubbleLight,
    borderRadius: moderateScale(2),
    overflow: 'hidden',
    marginBottom: verticalScale(8),
  },
  audioWave: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: moderateScale(2),
  },
  audioWaveText: {
    fontSize: moderateScale(12),
    color: colors.textLight,
    fontWeight: '500',
  },
  durationSection: {
    marginBottom: verticalScale(20),
  },
  durationTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: verticalScale(16),
    textAlign: 'center',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: moderateScale(12),
  },
  durationButton: {
    backgroundColor: colors.bubbleLight,
    paddingVertical: verticalScale(14),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: moderateScale(80),
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  durationButtonSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  customButton: {
    minWidth: moderateScale(100),
  },
  durationButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.textLight,
  },
  durationButtonTextSelected: {
    color: colors.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.secondary,
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    marginBottom: verticalScale(10),
  },
  startButton: {
    backgroundColor: colors.secondary,
    paddingVertical: verticalScale(16),
    paddingHorizontal: moderateScale(32),
    borderRadius: moderateScale(25),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
        shadowColor: colors.secondary,
      },
    }),
  },
  startButtonDisabled: {
    backgroundColor: colors.bubbleLight,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  startButtonText: {
    color: colors.primary,
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginRight: moderateScale(8),
  },
  startButtonIcon: {
    marginLeft: moderateScale(4),
  },
  sessionControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    marginTop: verticalScale(10),
    gap: moderateScale(10),
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(30),
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  resetButton: {
    backgroundColor: "#F3F6F4",
  },
  pauseButton: {
    backgroundColor: colors.secondary,
    flex: 1.4,
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  stopButton: {
    backgroundColor: "#F3F6F4",
  },
  controlButtonText: {
    fontSize: moderateScale(13),
    fontWeight: "600",
    marginLeft: moderateScale(6),
  },
  pauseButtonText: {
    color: colors.primary,
  },
  resetButtonText: {
    color: colors.textDark,
  },
  stopButtonText: {
    color: "#D64545",
    fontWeight: "700",
  },

});