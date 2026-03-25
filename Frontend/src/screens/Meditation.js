import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Platform,
    Image,
    useWindowDimensions,
    BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Enhanced responsive scaling functions
const scale = (size) => {
    const baseWidth = 375;
    const scaleFactor = Math.min(SCREEN_WIDTH / baseWidth, 1.3);
    return Math.round(size * scaleFactor);
};

const verticalScale = (size) => {
    const baseHeight = 812;
    const scaleFactor = Math.min(SCREEN_HEIGHT / baseHeight, 1.3);
    return Math.round(size * scaleFactor);
};

const moderateScale = (size, factor = 0.5) => {
    return size + (scale(size) - size) * factor;
};

// Dynamic font sizing
const getFontSize = (size) => {
    const scaleFactor = Math.min(SCREEN_WIDTH / 375, 1.2);
    return Math.round(size * scaleFactor);
};

const colors = {
    primary: "#FFFFFF",
    secondary: "#52ACD7",
    textDark: "#1A1B1E",
    textLight: "#6E6E6E",
    borderLight: "#E8E8E8",
    background: "#F5F9F3",
    shadow: "rgba(0, 0, 0, 0.1)",
    accent: "#DCEEF7",
    card: "#FFFFFF",
};

const images = {
    calm_focus: require("../../assets/yoga.png"),
    severe_breath: require("../../assets/aerobic.png"),
    inner_pet: require("../../assets/yoga-pose.png"),
    stress_relief: require("../../assets/meditation.png"),
    deep_relax: require("../../assets/yoga(1).png"),
    calm_rein: require("../../assets/aerobic.png"),
};

const meditationData = {
    featured: {
        id: "1",
        title: "Intro to Meditation",
        duration: "8 mins",
        categories: ["All", "Mindfulness", "Stress Reduction"],
        script: [
            "Welcome to your first meditation. Find a comfortable position and gently close your eyes.",
            "Take a deep breath in through your nose, and slowly exhale through your mouth.",
            "Let your shoulders drop and release any tension you are holding.",
            "Notice the rhythm of your breathing. There is no need to change it, just observe.",
            "With each breath, allow yourself to settle deeper into stillness.",
            "If your mind wanders, that is perfectly okay. Gently guide your attention back to your breath.",
            "You are doing beautifully. Stay here in this calm space for a moment.",
            "When you are ready, slowly open your eyes. Carry this peace with you.",
        ],
    },
    categories: [
        {
            id: "1",
            title: "Mindfulness",
            items: [
                {
                    id: "1",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "2",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "3",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
                {
                    id: "4",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "5",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "6",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
                {
                    id: "7",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "8",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "9",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
                {
                    id: "10",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "11",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "12",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
                {
                    id: "13",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "14",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "15",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
            ],
        },
        {
            id: "2",
            title: "Stress Reduction",
            items: [
                {
                    id: "4",
                    title: "Stress Relief",
                    duration: "15 mins",
                    image: images.stress_relief,
                    script: [
                        "Welcome to Stress Relief. Let us release the weight you have been carrying.",
                        "Find a comfortable position. Close your eyes and take a slow, deep breath.",
                        "Scan your body from head to toe. Notice where you hold tension.",
                        "Starting with your forehead, consciously relax those muscles. Let them soften.",
                        "Move to your jaw. Unclench it. Let your mouth relax slightly open.",
                        "Drop your shoulders away from your ears. Feel the tension melting away.",
                        "Relax your hands. Unclench your fists. Let your fingers rest gently.",
                        "Now breathe into any remaining tight spots. Send warmth and relief there.",
                        "With each exhale, imagine stress leaving your body as dark smoke dissolving into light.",
                        "You are safe. You are supported. You can let go.",
                    ],
                },
                {
                    id: "5",
                    title: "Deep Relax",
                    duration: "20 mins",
                    image: images.deep_relax,
                    script: [
                        "Welcome to Deep Relax. Allow yourself to completely surrender to this moment.",
                        "Lie down or sit in the most comfortable position you can find.",
                        "Close your eyes. Take three slow, deep breaths.",
                        "Feel your body becoming heavy, sinking into the surface beneath you.",
                        "Starting with your toes, send a wave of relaxation upward through your body.",
                        "Feel it moving through your feet, your ankles, your calves.",
                        "The warm wave rises through your knees, your thighs, your hips.",
                        "It flows through your belly, your chest, softening everything it touches.",
                        "The relaxation spreads through your arms, your neck, your face.",
                        "Your entire body is now deeply relaxed. You are floating in calm.",
                        "Rest here. There is nothing to do, nowhere to be. Just breathe and be.",
                    ],
                },
                {
                    id: "6",
                    title: "Calm Rein",
                    duration: "35 mins",
                    image: images.calm_rein,
                    script: [
                        "Welcome to Calm Rein. This session will help you regain control over your inner world.",
                        "Sit comfortably and close your eyes. Take a moment to arrive fully in this space.",
                        "Breathe in deeply and whisper to yourself: I am in control.",
                        "Imagine you are holding the reins of a gentle horse. This horse is your mind.",
                        "Sometimes it races ahead. Sometimes it wanders off the path.",
                        "But you hold the reins with steady, gentle hands. You guide it back with patience.",
                        "Breathe in calm. Breathe out chaos. You are the rider, not the storm.",
                        "Feel the rhythm of your breathing becoming steady like hoofbeats on soft earth.",
                        "With each breath, you are more centered, more grounded, more at peace.",
                        "You have the power to choose calm. You always have.",
                        "Take a deep breath and open your eyes. You are in control.",
                    ],
                },
            ],
        },
        {
            id: "3",
            title: "Mindfulness",
            items: [
                {
                    id: "1",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "2",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "3",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
            ],
        },
        {
            id: "4",
            title: "Mindfulness",
            items: [
                {
                    id: "1",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "2",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "3",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
            ],
        },
        {
            id: "5",
            title: "Mindfulness",
            items: [
                {
                    id: "1",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "2",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "3",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
            ],
        },
        {
            id: "6",
            title: "Mindfulness",
            items: [
                {
                    id: "1",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "2",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "3",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
            ],
        },
        {
            id: "7",
            title: "Mindfulness",
            items: [
                {
                    id: "1",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "2",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "3",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
            ],
        },
        {
            id: "8",
            title: "Mindfulness",
            items: [
                {
                    id: "1",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "2",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "3",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
            ],
        },
        {
            id: "9",
            title: "Mindfulness",
            items: [
                {
                    id: "1",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "2",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "3",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
            ],
        },
        {
            id: "10",
            title: "Mindfulness",
            items: [
                {
                    id: "10",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "2",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "3",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
            ],
        },
        {
            id: "11",
            title: "Mindfulness",
            items: [
                {
                    id: "1",
                    title: "Calm Focus",
                    duration: "10 mins",
                    image: images.calm_focus,
                    script: [
                        "Welcome to Calm Focus. Sit comfortably and let your hands rest on your lap.",
                        "Close your eyes and take three deep breaths. In through the nose, out through the mouth.",
                        "Now bring your attention to the space between your eyebrows. This is your center of focus.",
                        "Imagine a soft, warm light glowing at that point. Let it grow brighter with each breath.",
                        "If thoughts arise, simply acknowledge them and let them drift away like clouds.",
                        "Return your attention to the warm light. Feel it radiating calm energy through your mind.",
                        "With each exhale, release distractions. With each inhale, draw in clarity.",
                        "You are focused. You are calm. You are present.",
                        "Take one more deep breath and gently open your eyes when you are ready.",
                    ],
                },
                {
                    id: "2",
                    title: "Severe Breath",
                    duration: "20 mins",
                    image: images.severe_breath,
                    script: [
                        "Welcome to Severe Breath. This session will deepen your connection with your breathing.",
                        "Sit tall with your spine straight. Place one hand on your chest and one on your belly.",
                        "Breathe in deeply for four counts. One, two, three, four.",
                        "Hold your breath gently for four counts. One, two, three, four.",
                        "Now exhale slowly for six counts. One, two, three, four, five, six.",
                        "Repeat this pattern. Inhale for four, hold for four, exhale for six.",
                        "Feel the air filling your lungs completely. Notice your belly expanding.",
                        "As you exhale, feel your body releasing tension from every muscle.",
                        "Continue this rhythm. Let each cycle bring you deeper into relaxation.",
                        "Your breath is your anchor. It is always here for you.",
                        "Take one final deep breath. Hold it. And release completely.",
                    ],
                },
                {
                    id: "3",
                    title: "Inner Pet",
                    duration: "35 mins",
                    image: images.inner_pet,
                    script: [
                        "Welcome to Inner Pet. This is a journey inward to connect with your inner peace.",
                        "Close your eyes and imagine yourself in a quiet, sunlit meadow.",
                        "The grass is soft beneath you. A gentle breeze carries the scent of wildflowers.",
                        "In the distance, you see a gentle animal approaching you. It could be any creature that brings you comfort.",
                        "Watch as it comes closer. It sits beside you, calm and trusting.",
                        "Reach out and feel its warmth. This creature represents your inner compassion.",
                        "Sit together in silence. Feel the unconditional acceptance it offers you.",
                        "Whatever burdens you carry, you can set them down here in this meadow.",
                        "Breathe deeply and feel the peace radiating from this connection.",
                        "When you are ready, thank your companion and slowly return to the present moment.",
                        "Open your eyes gently, carrying this warmth and compassion with you.",
                    ],
                },
            ],
        },

    ],
};

export default function Meditation({ currentScreen, onNavigate }) {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [selectedCategory, setSelectedCategory] = useState(null);

    const featuredCardHeight = verticalScale(180);

    // Hardware back: if inside a category, go back to categories list
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (selectedCategory) {
                    setSelectedCategory(null);
                    return true;
                }
                return false;
            };
            const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
            return () => sub.remove();
        }, [selectedCategory])
    );

    const handleNavigateToSession = (session) => {
        navigation.navigate("MeditationSession", {
            session,
            durationOptions: [1, 2, 5, 10],
        });
    };

    // ---------- Category Cards View ----------
    const renderCategoryCard = ({ item }) => {
        const categoryImage = item.items[0]?.image;
        return (
            <TouchableOpacity
                style={styles.categoryCard}
                onPress={() => setSelectedCategory(item)}
                activeOpacity={0.8}
            >
                {categoryImage && (
                    <Image source={categoryImage} style={styles.categoryCardImage} />
                )}
                <Text style={styles.categoryCardTitle}>{item.title}</Text>
            </TouchableOpacity>
        );
    };

    // ---------- Meditation List Item (inside category) ----------
    const renderMeditationListItem = ({ item }) => (
        <TouchableOpacity
            style={styles.meditationListItem}
            onPress={() => handleNavigateToSession(item)}
            activeOpacity={0.7}
        >
            <View style={styles.meditationListPlayCircle}>
                <Ionicons style={{ paddingLeft: 4 }} name="play" size={moderateScale(18)} color={colors.primary} />
            </View>
            <View style={styles.meditationListInfo}>
                <Text style={styles.meditationListTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.meditationListDuration}>{item.duration}</Text>
            </View>
            <Ionicons name="chevron-forward" size={moderateScale(18)} color={colors.textLight} />
        </TouchableOpacity>
    );

    // ---------- Category Detail View ----------
    if (selectedCategory) {
        return (
            <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
                <Header
                    title={selectedCategory.title}
                    titleAlignment="center"
                    showLeftIcon={true}
                    leftIconName="arrow-back"
                    onLeftIconPress={() => setSelectedCategory(null)}
                    showRightIcon={false}
                    backgroundColor="#FFFFFF"
                    borderBottomColor="rgba(82, 172, 215, 0.1)"
                />
                <FlatList
                    data={selectedCategory.items}
                    renderItem={renderMeditationListItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.meditationListContainer}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
                />
            </SafeAreaView>
        );
    }

    // ---------- Categories Home View ----------
    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <Header
                title="Meditations"
                titleAlignment="center"
                showLeftIcon={false}
                showRightIcon={false}
                backgroundColor="#FFFFFF"
                borderBottomColor="rgba(82, 172, 215, 0.1)"
            />

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Featured Meditation */}
                <View style={[styles.featuredCard, { height: featuredCardHeight }]}>
                    <View style={styles.featuredContent}>
                        <Text style={styles.featuredTitle}>
                            {meditationData.featured.title}
                        </Text>
                        <Text style={styles.featuredDuration}>
                            {meditationData.featured.duration}
                        </Text>

                        <View style={styles.featuredDividerRow}>
                            <View style={[styles.featuredDividerPart, styles.featuredDividerSmall, styles.featuredDividerBlue]} />
                            <View style={[styles.featuredDividerPart, styles.featuredDividerMedium, styles.featuredDividerWhite]} />
                            <View style={[styles.featuredDividerPart, styles.featuredDividerLarge, styles.featuredDividerWhite]} />
                        </View>

                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => handleNavigateToSession(meditationData.featured)}
                        >
                            <Text style={styles.startButtonText}>Start Meditation</Text>
                            <Ionicons
                                name="play"
                                size={moderateScale(16)}
                                color={colors.primary}
                                style={styles.playIcon}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Category Cards */}
                <View style={styles.categoriesGridHeader}>
                    <Text style={styles.categoriesGridTitle}>Categories</Text>
                </View>
                <FlatList
                    data={meditationData.categories}
                    renderItem={renderCategoryCard}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    scrollEnabled={false}
                    contentContainerStyle={styles.categoriesGrid}
                    columnWrapperStyle={styles.categoriesRow}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    scrollContainer: {
        paddingBottom: verticalScale(40),
    },

    // Featured Card
    featuredCard: {
        margin: moderateScale(20),
        borderRadius: moderateScale(16),
        overflow: "hidden",
        backgroundColor: colors.accent,
        justifyContent: "center",
        padding: moderateScale(20),
        ...Platform.select({
            ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            },
            android: {
                elevation: 5,
                shadowColor: colors.shadow,
            },
        }),
    },
    featuredContent: {
        flex: 1,
        justifyContent: "center"
    },
    featuredTitle: {
        fontSize: getFontSize(22),
        fontWeight: "700",
        color: colors.textDark,
        marginBottom: verticalScale(4),
    },
    featuredDuration: {
        fontSize: getFontSize(14),
        color: colors.textDark,
        marginBottom: verticalScale(12)
    },
    featuredDividerRow: {
        flexDirection: "row",
        alignItems: "center",
        height: scale(5),
        marginBottom: verticalScale(2),
        gap: moderateScale(4),
    },
    featuredDividerPart: {
        height: scale(12),
        borderRadius: scale(8),
    },
    featuredDividerSmall: { flex: 1.5 },
    featuredDividerMedium: { flex: 2.5 },
    featuredDividerLarge: { flex: 3 },
    featuredDividerBlue: { backgroundColor: colors.secondary },
    featuredDividerWhite: { backgroundColor: colors.primary },

    startButton: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: colors.secondary,
        paddingVertical: verticalScale(10),
        paddingHorizontal: moderateScale(20),
        borderRadius: moderateScale(10),
        marginTop: verticalScale(14),
        minHeight: verticalScale(44),
    },
    startButtonText: {
        color: colors.primary,
        fontSize: getFontSize(14),
        fontWeight: "600",
        marginRight: moderateScale(6),
    },
    playIcon: {
        marginLeft: moderateScale(2)
    },

    // Category Cards Grid
    categoriesGridHeader: {
        paddingHorizontal: moderateScale(20),
        marginBottom: verticalScale(12),
    },
    categoriesGridTitle: {
        fontSize: getFontSize(20),
        fontWeight: "700",
        color: colors.textDark,
    },
    categoriesGrid: {
        paddingHorizontal: moderateScale(16),
    },
    categoriesRow: {
        justifyContent: "space-between",
        marginBottom: moderateScale(14),
    },
    categoryCard: {
        width: (SCREEN_WIDTH - moderateScale(16) * 2 - moderateScale(14)) / 2,
        backgroundColor: colors.card,
        borderRadius: moderateScale(16),
        alignItems: "center",
        paddingVertical: moderateScale(20),
        paddingHorizontal: moderateScale(12),
        ...Platform.select({
            ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.12,
                shadowRadius: 6,
            },
            android: {
                elevation: 4,
                shadowColor: colors.shadow,
            },
        }),
    },
    categoryCardImage: {
        width: moderateScale(70),
        height: moderateScale(70),
        resizeMode: "contain",
        marginBottom: verticalScale(12),
    },
    categoryCardTitle: {
        fontSize: getFontSize(16),
        fontWeight: "700",
        color: colors.textDark,
        textAlign: "center",
    },

    // Meditation List (inside category detail)
    meditationListContainer: {
        paddingHorizontal: moderateScale(16),
        paddingTop: verticalScale(12),
        paddingBottom: verticalScale(40),
    },
    meditationListItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.card,
        borderRadius: moderateScale(14),
        paddingVertical: moderateScale(14),
        paddingHorizontal: moderateScale(14),
        ...Platform.select({
            ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
                shadowColor: colors.shadow,
            },
        }),
    },
    meditationListPlayCircle: {
        width: moderateScale(42),
        height: moderateScale(42),
        borderRadius: moderateScale(21),
        backgroundColor: colors.secondary,
        justifyContent: "center",
        alignItems: "center",
        marginRight: moderateScale(14),
    },
    meditationListInfo: {
        flex: 1,
    },
    meditationListTitle: {
        fontSize: getFontSize(16),
        fontWeight: "600",
        color: colors.textDark,
    },
    meditationListDuration: {
        fontSize: getFontSize(13),
        color: colors.textLight,
        marginTop: verticalScale(2),
    },
    listSeparator: {
        height: moderateScale(10),
    },
});
