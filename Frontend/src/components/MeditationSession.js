import React, { useState, useRef, useEffect, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    SafeAreaView,
    Platform,
    BackHandler,
    Alert,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Pause, Play } from "lucide-react-native";
import * as Speech from "expo-speech";

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
    const { session } = route.params || {};

    const speedOptions = [
        { label: "0.5x", value: 0.5 },
        { label: "0.75x", value: 0.75 },
        { label: "1x", value: 1.0 },
        { label: "1.25x", value: 1.25 },
        { label: "1.5x", value: 1.5 },
    ];

    const [selectedSpeed, setSelectedSpeed] = useState(1.0);
    const [isBreathing, setIsBreathing] = useState(false);
    const [sessionActive, setSessionActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [loadingVoices, setLoadingVoices] = useState(true);
    const [isSpeakingNow, setIsSpeakingNow] = useState(false);
    const [currentWordIdx, setCurrentWordIdx] = useState(0);
    const TELE_WORDS_PER_LINE = 8;

    const allWords = useMemo(
        () => (session?.script || []).flatMap(line => line.split(/\s+/).filter(Boolean)),
        [session?.script]
    );

    const BAR_COUNT = 35;
    const VISUALIZER_COLORS = (() => {
        const stops = [
            [56, 182, 255],   // #38b6ff blue
            [56, 182, 255],   // #38b6ff blue


        ];
        const gradient = [];
        for (let i = 0; i < BAR_COUNT; i++) {
            const t = i / (BAR_COUNT - 1) * (stops.length - 1);
            const idx = Math.min(Math.floor(t), stops.length - 2);
            const p = t - idx;
            const r = Math.round(stops[idx][0] + (stops[idx + 1][0] - stops[idx][0]) * p);
            const g = Math.round(stops[idx][1] + (stops[idx + 1][1] - stops[idx][1]) * p);
            const b = Math.round(stops[idx][2] + (stops[idx + 1][2] - stops[idx][2]) * p);
            gradient.push(`rgb(${r},${g},${b})`);
        }
        return gradient;
    })();

    const pickRandomVisualizerColor = () => {
        const idx = Math.floor(Math.random() * VISUALIZER_COLORS.length);
        return VISUALIZER_COLORS[idx] || colors.secondary;
    };

    // Pre-compute random base heights for organic look
    const BAR_BASE_HEIGHTS = useRef(
        Array.from({ length: BAR_COUNT }, (_, i) => {
            const center = BAR_COUNT / 2;
            const dist = Math.abs(i - center) / center;
            return 0.3 + (1 - dist) * 0.5 + Math.random() * 0.2;
        })
    ).current;

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const waveBarAnims = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.2))).current;
    const speechTimeoutRef = useRef(null);
    const isSpeakingRef = useRef(false);
    const waveAnimRef = useRef(null);
    const windDownRef = useRef(null);
    const wordIntervalRef = useRef(null);
    const currentWordIdxRef = useRef(0);
    const selectedSpeedRef = useRef(selectedSpeed);
    const selectedVoiceRef = useRef(null);
    const speechFinishedRef = useRef(false);
    const wordsFinishedRef = useRef(false);
    const autoCompleteEnabledRef = useRef(false);

    const markSpeechFinished = () => {
        speechFinishedRef.current = true;
        if (autoCompleteEnabledRef.current && wordsFinishedRef.current) {
            handleSessionComplete();
        }
    };

    const markWordsFinished = () => {
        wordsFinishedRef.current = true;
        if (autoCompleteEnabledRef.current && speechFinishedRef.current) {
            handleSessionComplete();
        }
    };

    // Keep speed/voice/offsets refs synced for stale-closure-safe callbacks
    useEffect(() => { selectedSpeedRef.current = selectedSpeed; }, [selectedSpeed]);
    useEffect(() => { selectedVoiceRef.current = selectedVoice; }, [selectedVoice]);

    // Friendly persona names to assign to unique voices
    const personaNames = [
        "Sophia", "James", "Aria", "Ethan", "Luna",
        "Oliver", "Maya", "Leo", "Zara", "Noah",
        "Isla", "Kai", "Serene", "Aiden", "Clara",
    ];

    // Load available voices and deduplicate into unique personas
    useEffect(() => {
        const loadVoices = async () => {
            try {
                const availableVoices = await Speech.getAvailableVoicesAsync();
                const filteredVoices = availableVoices.filter(
                    (v) => v.language && v.language.startsWith("en")
                );

                // Deduplicate: keep one voice per unique underlying name/engine
                const seen = new Set();
                const uniqueVoices = [];
                for (const v of filteredVoices) {
                    const key = v.name.replace(/[-_#\d]/g, "").toLowerCase().trim();
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueVoices.push(v);
                    }
                }

                // Assign a friendly persona name to each unique voice
                const personas = uniqueVoices.slice(0, personaNames.length).map((v, i) => ({
                    ...v,
                    persona: personaNames[i],
                }));

                setVoices(personas);
                if (personas.length > 0) {
                    setSelectedVoice(personas[0]);
                }
            } catch (e) {
                // Fallback — no voice selection available
            } finally {
                setLoadingVoices(false);
            }
        };
        loadVoices();
    }, []);

    // Breathing animation
    useEffect(() => {
        if (isBreathing && sessionActive && !isPaused) {
            const breathingSequence = Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 1.3, duration: 4000, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
            ]);
            const runBreathing = () => {
                breathingSequence.start(({ finished }) => {
                    if (finished && isBreathing && sessionActive && !isPaused) runBreathing();
                });
            };
            runBreathing();

            const pulseSequence = Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 2000, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
            ]);
            const runPulse = () => {
                pulseSequence.start(({ finished }) => {
                    if (finished && isBreathing && sessionActive && !isPaused) runPulse();
                });
            };
            runPulse();
        } else if (isPaused) {
            scaleAnim.stopAnimation();
            pulseAnim.stopAnimation();
        }
        return () => {
            scaleAnim.stopAnimation();
            pulseAnim.stopAnimation();
        };
    }, [isBreathing, sessionActive, isPaused]);

    // Voice waveform bar animation — staggered organic wave with gradual wind-down
    useEffect(() => {
        // Cancel any pending wind-down
        if (windDownRef.current) {
            windDownRef.current.forEach(a => a?.stop());
            windDownRef.current = null;
        }

        if (sessionActive && !isPaused && isSpeakingNow) {
            // Stop previous loops before starting new ones
            if (waveAnimRef.current) waveAnimRef.current.forEach(a => a?.stop());
            const animations = waveBarAnims.map((anim, i) => {
                const baseH = BAR_BASE_HEIGHTS[i];
                const speed = 350 + Math.random() * 300;
                return Animated.loop(
                    Animated.sequence([
                        Animated.delay(i * 40),
                        Animated.timing(anim, { toValue: baseH, duration: speed, useNativeDriver: true }),
                        Animated.timing(anim, { toValue: baseH * 0.25, duration: speed, useNativeDriver: true }),
                    ])
                );
            });
            animations.forEach(a => a.start());
            waveAnimRef.current = animations;
        } else if (sessionActive && !isPaused && !isSpeakingNow) {
            // Gradual wind-down: stop loops then ease bars to idle
            if (waveAnimRef.current) waveAnimRef.current.forEach(a => a?.stop());
            waveAnimRef.current = null;
            const windDown = waveBarAnims.map((anim, i) =>
                Animated.timing(anim, {
                    toValue: 0.08,
                    duration: 600 + i * 20,
                    useNativeDriver: true,
                })
            );
            windDown.forEach(a => a.start());
            windDownRef.current = windDown;
        } else if (sessionActive && isPaused) {
            // Pause: freeze bars at current heights (no reset)
            if (waveAnimRef.current) waveAnimRef.current.forEach(a => a?.stop());
            if (windDownRef.current) windDownRef.current.forEach(a => a?.stop());
            waveAnimRef.current = null;
            windDownRef.current = null;
        } else {
            // Not active — reset to idle
            if (waveAnimRef.current) waveAnimRef.current.forEach(a => a?.stop());
            waveAnimRef.current = null;
            waveBarAnims.forEach(a => a.setValue(0.2));
        }
        return () => {
            if (waveAnimRef.current) waveAnimRef.current.forEach(a => a?.stop());
            if (windDownRef.current) windDownRef.current.forEach(a => a?.stop());
        };
    }, [sessionActive, isPaused, isSpeakingNow]);

    // Script speech effect — one continuous utterance with punctuation-aware subtitle timing
    useEffect(() => {
        const script = session?.script;
        if (!script || script.length === 0 || !sessionActive || isPaused || isSpeakingRef.current) return;

        const spd = selectedSpeedRef.current;

        const speechRate = Math.max(0.2, spd);
        const voice = selectedVoiceRef.current;
        const startIdx = currentWordIdxRef.current;
        const remainingWords = allWords.slice(startIdx);
        if (remainingWords.length === 0) {
            handleSessionComplete();
            return;
        }

        const effectiveRate = speechRate * 1.15;
        // Estimate speaking pace by character throughput, then weight each word.
        const charsPerSecondAtNormalRate = 13;
        const cps = charsPerSecondAtNormalRate * effectiveRate;
        const wordDurations = remainingWords.map((word, i) => {
            const clean = word.replace(/[.,!?;:()"'\-]/g, '');
            const charCount = Math.max(clean.length, 1);
            let ms = (charCount / cps) * 1000;

            // Short words are spoken quickly, long words need more hold time.
            if (charCount <= 2) ms *= 0.78;
            if (charCount >= 8) ms *= 1.18;

            // Natural phrase/sentence pauses from punctuation.
            if (/[.!?][\"']?$/.test(word)) ms += 360 / effectiveRate;
            else if (/[,;:][\"']?$/.test(word)) ms += 170 / effectiveRate;

            // Tiny easing before conjunctions improves perceived sync.
            const nextWord = remainingWords[i + 1]?.toLowerCase?.() || '';
            if (nextWord === 'and' || nextWord === 'but' || nextWord === 'or') {
                ms += 35;
            }

            return Math.max(70, Math.min(1200, Math.round(ms)));
        });

        isSpeakingRef.current = true;
        setIsSpeakingNow(true);
        speechFinishedRef.current = false;
        wordsFinishedRef.current = false;
        autoCompleteEnabledRef.current = true;

        // One-go speech from current position (TTS naturally pauses at punctuation)
        Speech.speak(remainingWords.join(' '), {
            language: voice?.language || 'en-US',
            ...(voice ? { voice: voice.identifier } : {}),
            rate: speechRate,
            pitch: 1.0,
            onDone: markSpeechFinished,
            onStopped: markSpeechFinished,
            onError: markSpeechFinished,
        });

        // Subtitle progression continues independent of audio state
        let localIdx = 0;
        const runWordTick = () => {
            const nextGlobalIdx = startIdx + localIdx + 1;
            currentWordIdxRef.current = nextGlobalIdx;
            setCurrentWordIdx(nextGlobalIdx);

            localIdx += 1;
            if (localIdx >= wordDurations.length) {
                isSpeakingRef.current = false;
                setIsSpeakingNow(false);
                markWordsFinished();
                return;
            }
            speechTimeoutRef.current = setTimeout(runWordTick, wordDurations[localIdx]);
        };

        speechTimeoutRef.current = setTimeout(runWordTick, wordDurations[0]);

        return () => {
            clearTimeout(speechTimeoutRef.current);
        };
    }, [sessionActive, isPaused, allWords]);

    // Cleanup speech on unmount
    useEffect(() => {
        return () => {
            Speech.stop();
            clearTimeout(speechTimeoutRef.current);
            clearInterval(wordIntervalRef.current);
        };
    }, []);

    // Handle hardware back button
    useEffect(() => {
        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                if (sessionActive) {
                    // Show confirmation dialog if session is active
                    Alert.alert(
                        "Leave Meditation?",
                        "Are you sure you want to stop your meditation session?",
                        [
                            {
                                text: "Cancel",
                                onPress: () => null,
                                style: "cancel"
                            },
                            {
                                text: "Leave",
                                onPress: () => {
                                    handleSessionComplete();
                                },
                                style: "destructive"
                            }
                        ]
                    );
                    return true; // Prevent default back behavior
                } else {
                    // Allow default back behavior when session is not active
                    return false;
                }
            }
        );

        return () => backHandler.remove();
    }, [sessionActive]);

    const startSession = () => {
        isSpeakingRef.current = false;
        currentWordIdxRef.current = 0;
        speechFinishedRef.current = false;
        wordsFinishedRef.current = false;
        autoCompleteEnabledRef.current = true;
        setCurrentWordIdx(0);
        setSessionActive(true);
        setIsBreathing(true);
        setIsPaused(false);
    };

    const pauseSession = () => {
        autoCompleteEnabledRef.current = false;
        Speech.stop();
        clearTimeout(speechTimeoutRef.current);
        clearInterval(wordIntervalRef.current);
        isSpeakingRef.current = false;
        setIsSpeakingNow(false);
        setIsPaused(true);
        setIsBreathing(false);
    };

    const resumeSession = () => {
        autoCompleteEnabledRef.current = true;
        speechFinishedRef.current = false;
        wordsFinishedRef.current = false;
        setIsPaused(false);
        setIsBreathing(true);
    };

    const resetSession = () => {
        autoCompleteEnabledRef.current = false;
        Speech.stop();
        clearTimeout(speechTimeoutRef.current);
        clearInterval(wordIntervalRef.current);
        isSpeakingRef.current = false;
        currentWordIdxRef.current = 0;
        speechFinishedRef.current = false;
        wordsFinishedRef.current = false;
        setCurrentWordIdx(0);
        setIsSpeakingNow(false);
        setIsPaused(true);
        setIsBreathing(false);
        scaleAnim.stopAnimation();
        pulseAnim.stopAnimation();
    };

    const handleSessionComplete = () => {
        autoCompleteEnabledRef.current = false;
        Speech.stop();
        clearTimeout(speechTimeoutRef.current);
        clearInterval(wordIntervalRef.current);
        isSpeakingRef.current = false;
        currentWordIdxRef.current = 0;
        speechFinishedRef.current = false;
        wordsFinishedRef.current = false;
        setCurrentWordIdx(0);
        setIsSpeakingNow(false);
        setSessionActive(false);
        setIsBreathing(false);
        setIsPaused(false);
    };

    const handleSpeedSelect = (speed) => {
        setSelectedSpeed(speed);
    };

    const sessionTitle = session?.title || "Deep Breath Dynamics";

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Session Info */}
                <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>{sessionTitle}</Text>
                </View>

                {/* Breathing Circle */}
                <View style={styles.breathingContainer}>
                    <View style={styles.breathingCircleContainer}>
                        {/* Outer glow effect */}
                        <Animated.View
                            style={[
                                styles.breathingGlow,
                                {
                                    transform: [{ scale: pulseAnim }],
                                    opacity: sessionActive ? 0.2 : 0,
                                }
                            ]}
                        />

                        {/* Main breathing circle */}
                        <Animated.View
                            style={[
                                styles.breathingCircle,
                                {
                                    transform: [{ scale: scaleAnim }],
                                    backgroundColor: sessionActive ? colors.secondary : colors.accent,
                                },
                            ]}
                        />

                        {/* Inner circle — mute/unmute; play when paused */}
                        {!sessionActive &&
                            <TouchableOpacity
                                style={styles.breathingCircleInner}
                                onPress={startSession}
                            >
                                <View style={styles.readyContainer}>
                                    <Ionicons name="play" size={moderateScale(40)} color={colors.secondary} />
                                    <Text style={styles.readyText}>Ready</Text>
                                </View>
                            </TouchableOpacity>
                        }
                        {sessionActive && (
                            <View style={styles.visualizerContainer}>
                                {waveBarAnims.map((anim, i) => (
                                    <Animated.View
                                        key={i}
                                        style={[
                                            styles.vizBar,
                                            {
                                                backgroundColor: VISUALIZER_COLORS[i],
                                                transform: [{
                                                    scaleY: anim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0.15, 1],
                                                    }),
                                                }],
                                            },
                                        ]}
                                    />
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Audio Visualizer */}
                    {/* {sessionActive && (
                        <View style={styles.visualizerContainer}>
                            {waveBarAnims.map((anim, i) => (
                                <Animated.View
                                    key={i}
                                    style={[
                                        styles.vizBar,
                                        {
                                            backgroundColor: VISUALIZER_COLORS[i],
                                            transform: [{
                                                scaleY: anim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.15, 1],
                                                }),
                                            }],
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                    )} */}

                </View>

                {/* Duration & Voice Selection - Only show when session is not active */}
                {!sessionActive && (
                    <View style={styles.durationSection}>
                        <Text style={styles.durationTitle}>Select Speed</Text>
                        <View style={styles.durationGrid}>
                            {speedOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.label}
                                    style={[
                                        styles.durationButton,
                                        selectedSpeed === option.value && styles.durationButtonSelected,
                                    ]}
                                    onPress={() => handleSpeedSelect(option.value)}
                                >
                                    <Text style={[
                                        styles.durationButtonText,
                                        selectedSpeed === option.value && styles.durationButtonTextSelected,
                                    ]}>
                                        {option.label}
                                    </Text>
                                    {/* {selectedSpeed === option.value && (
                                        <View style={styles.selectedIndicator}>
                                            <Ionicons name="checkmark" size={moderateScale(16)} color={colors.primary} />
                                        </View>
                                    )} */}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Voice Selection */}
                        <Text style={[styles.durationTitle, { marginTop: verticalScale(20) }]}>Select Voice</Text>
                        {loadingVoices ? (
                            <ActivityIndicator size="small" color={colors.secondary} />
                        ) : voices.length > 0 ? (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.voiceList}
                            >
                                {voices.map((voice) => (
                                    <TouchableOpacity
                                        key={voice.identifier}
                                        style={[
                                            styles.voiceButton,
                                            selectedVoice?.identifier === voice.identifier && styles.voiceButtonSelected,
                                        ]}
                                        onPress={() => {
                                            setSelectedVoice(voice);
                                            Speech.stop();
                                            Speech.speak(`Hi, I'm ${voice.persona}. Let's begin.`, {
                                                voice: voice.identifier,
                                                language: voice.language,
                                                rate: 0.9,
                                                pitch: 1.0,
                                            });
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.voiceName,
                                                selectedVoice?.identifier === voice.identifier && styles.voiceNameSelected,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {voice.persona}
                                        </Text>

                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <Text style={styles.noVoicesText}>Using default voice</Text>
                        )}
                    </View>
                )}

                {/* Control Buttons - Positioned at bottom */}
                <View style={styles.controls}>
                    {!sessionActive ? (
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={startSession}
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
                                <Ionicons name="refresh" size={moderateScale(24)} color={colors.secondary} />
                            </TouchableOpacity>

                            {/* Pause/Resume Button (Primary) */}
                            <TouchableOpacity
                                style={[styles.controlButton, styles.pauseButton]}
                                onPress={isPaused ? resumeSession : pauseSession}
                            >
                                {isPaused ? (
                                    <Play

                                        size={moderateScale(40)}
                                        color={colors.secondary}
                                        fill={colors.primary}
                                        style={{ paddingLeft: isPaused ? moderateScale(4) : 0 }}
                                    />
                                ) : <Pause size={moderateScale(40)} color={colors.secondary} fill={colors.primary} />}
                            </TouchableOpacity>

                            {/* Stop Button */}
                            <TouchableOpacity style={[styles.controlButton, styles.stopButton]} onPress={handleSessionComplete}>
                                <Ionicons name="stop" size={moderateScale(24)} color={colors.secondary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
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
        justifyContent: "space-between",
    },
    sessionInfo: {
        alignItems: "center",
        marginBottom: verticalScale(20),
        paddingHorizontal: moderateScale(10),
    },
    sessionTitle: {
        fontSize: moderateScale(24),

        color: colors.textDark,
        textAlign: "center",
        marginBottom: verticalScale(8),
    },
    breathingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: verticalScale(10),
    },
    breathingCircleContainer: {
        width: moderateScale(220),
        height: moderateScale(220),
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        marginBottom: verticalScale(40),
    },
    breathingGlow: {
        position: "absolute",
        width: "120%",
        height: "120%",
        borderRadius: moderateScale(132),
        backgroundColor: colors.secondary,
    },
    breathingCircle: {
        width: "100%",
        height: "100%",
        borderRadius: moderateScale(110),
        position: "absolute",
        opacity: 0.25,
    },
    breathingCircleInner: {
        width: moderateScale(140),
        height: moderateScale(140),
        borderRadius: moderateScale(70),
        backgroundColor: colors.primary,
        justifyContent: "center",
        alignItems: "center",
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
        alignItems: "center",
    },
    timerText: {
        fontSize: moderateScale(32),
        fontWeight: "800",
        color: colors.textDark,
        letterSpacing: 1,
    },
    timerLabel: {
        fontSize: moderateScale(12),
        color: colors.textLight,
        fontWeight: "600",
        marginTop: verticalScale(4),
        letterSpacing: 0.5,
    },
    waveformContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: moderateScale(50),
        gap: moderateScale(5),
    },
    waveBar: {
        width: moderateScale(6),
        height: moderateScale(40),
        borderRadius: moderateScale(3),
        backgroundColor: colors.secondary,
    },
    visualizerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: verticalScale(90),
        width: "100%",
        marginTop: verticalScale(8),
        gap: 2,
    },
    vizBar: {
        flex: 1,
        maxWidth: moderateScale(7),
        height: "100%",
        borderRadius: moderateScale(3),
    },
    progressText: {
        fontSize: moderateScale(12),
        color: colors.textLight,
        marginTop: verticalScale(6),
        fontWeight: "500",
    },
    readyContainer: {
        alignItems: "center",
    },
    readyText: {
        fontSize: moderateScale(14),
        color: colors.textLight,
        marginTop: verticalScale(8),
        fontWeight: "500",
    },
    audioWaveContainer: {
        alignItems: "center",
        marginTop: verticalScale(20),
    },
    audioWaveLine: {
        width: moderateScale(200),
        height: verticalScale(4),
        backgroundColor: colors.bubbleLight,
        borderRadius: moderateScale(2),
        overflow: "hidden",
        marginBottom: verticalScale(8),
    },
    audioWave: {
        width: "100%",
        height: "100%",
        backgroundColor: colors.secondary,
        borderRadius: moderateScale(2),
    },
    audioWaveText: {
        fontSize: moderateScale(12),
        color: colors.textLight,
        fontWeight: "500",
    },
    durationSection: {
        marginBottom: verticalScale(20),
    },
    durationTitle: {
        fontSize: moderateScale(18),
        fontWeight: "600",
        color: colors.textDark,
        marginBottom: verticalScale(16),
        textAlign: "center",
    },
    durationGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: moderateScale(12),
    },
    durationButton: {
        backgroundColor: colors.bubbleLight,
        paddingVertical: verticalScale(14),
        paddingHorizontal: moderateScale(20),
        borderRadius: moderateScale(12),
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
        minWidth: moderateScale(80),
        position: "relative",
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
        fontWeight: "600",
        color: colors.textLight,
    },
    durationButtonTextSelected: {
        color: colors.primary,
    },
    selectedIndicator: {
        position: "absolute",
        top: -6,
        right: -6,
        backgroundColor: colors.secondary,
        width: moderateScale(20),
        height: moderateScale(20),
        borderRadius: moderateScale(10),
        justifyContent: "center",
        alignItems: "center",
    },
    controls: {
        marginBottom: verticalScale(10),
    },
    startButton: {
        backgroundColor: colors.secondary,
        paddingVertical: verticalScale(16),
        paddingHorizontal: moderateScale(32),
        borderRadius: moderateScale(25),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
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
        fontWeight: "400",
        marginRight: moderateScale(8),
    },
    startButtonIcon: {
        marginLeft: moderateScale(4),
    },
    sessionControls: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-end",
        width: "100%",
        marginTop: verticalScale(10),
        paddingHorizontal: moderateScale(20),
    },
    controlButton: {
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        backgroundColor: colors.card,
        marginBottom: verticalScale(60),
    },
    resetButton: {
        width: moderateScale(70),
        height: moderateScale(70),
        backgroundColor: "#F3F6F4",
        marginRight: moderateScale(20),

    },
    pauseButton: {
        width: moderateScale(100),
        height: moderateScale(100),
        backgroundColor: colors.secondary,
        marginHorizontal: moderateScale(10),
        marginBottom: verticalScale(80),
    },
    stopButton: {
        width: moderateScale(70),
        height: moderateScale(70),
        backgroundColor: "#F3F6F4",
        marginLeft: moderateScale(20),
    },
    voiceList: {
        paddingHorizontal: moderateScale(4),
        gap: moderateScale(10),
    },
    voiceButton: {
        backgroundColor: colors.bubbleLight,
        paddingVertical: verticalScale(10),
        paddingHorizontal: moderateScale(16),
        borderRadius: moderateScale(12),
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
        minWidth: moderateScale(100),
    },
    voiceButtonSelected: {
        backgroundColor: colors.secondary,
        borderColor: colors.secondary,
    },
    voiceName: {
        fontSize: moderateScale(13),
        fontWeight: "600",
        color: colors.textDark,
    },
    voiceNameSelected: {
        color: colors.primary,
    },
    voiceLanguage: {
        fontSize: moderateScale(11),
        color: colors.textLight,
        marginTop: verticalScale(2),
    },
    voiceLanguageSelected: {
        color: "rgba(255,255,255,0.7)",
    },
    noVoicesText: {
        fontSize: moderateScale(13),
        color: colors.textLight,
        textAlign: "center",
    },
});
