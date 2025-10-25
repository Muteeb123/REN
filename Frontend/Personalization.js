import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Google Fonts
import {
  useFonts,
  NunitoSans_400Regular,
  NunitoSans_500Medium,
  NunitoSans_600SemiBold,
  NunitoSans_700Bold,
  NunitoSans_800ExtraBold,
} from '@expo-google-fonts/nunito-sans';
import AppLoading from 'expo-app-loading';

const FONT = {
  regular: 'NunitoSans_400Regular',
  medium: 'NunitoSans_500Medium',
  semiBold: 'NunitoSans_600SemiBold',
  bold: 'NunitoSans_700Bold',
  extraBold: 'NunitoSans_800ExtraBold',
};

const colors = {
  background: '#FFFFFF',
  primary: '#59bceb',
  primaryLight: '#E8F5E8',
  primaryDark: '#5A8C5A',
  secondary: '#333333',
  buttonText: '#FFFFFF',
  border: '#E8E8E8',
  textLight: '#666666',
  textLighter: '#999999',
  gray: "#E9E9E9",
};

const { width, height } = Dimensions.get('window');

const Questionnaire = () => {
  const navigation = useNavigation();

  let [fontsLoaded] = useFonts({
    NunitoSans_400Regular,
    NunitoSans_500Medium,
    NunitoSans_600SemiBold,
    NunitoSans_700Bold,
    NunitoSans_800ExtraBold,
  });

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    name: '',
    gender: '',
    age: 28,
    goals: [],
    causes: [],
  });

  const scrollY = useState(new Animated.Value(0))[0];
  const ages = Array.from({ length: 40 }, (_, i) => 18 + i);
  const [skipPressed, setSkipPressed] = useState(false);

  const goals = [
    'Manage Anxiety',
    'Reduce Stress',
    'Improve Mood',
    'Improve Sleep',
    'Enhance Relationships',
    'Boost Confidence',
  ];

  const causes = [
    'Work/School',
    'Relationships',
    'Finances',
    'Health Concerns',
    'Life Changes',
  ];

  const toggleSelection = (field, value) => {
    setAnswers((prev) => {
      const updated = prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value];
      return { ...prev, [field]: updated };
    });
  };

  const handleContinue = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      navigation.navigate("MainTabs", { screen: "Chat" });
    }
  };

  const handleSkipAll = () => {
    navigation.navigate("MainTabs", { screen: "Chat" });
  };

  const isContinueDisabled = () => {
    switch (step) {
      case 1:
        return answers.name.trim() === '';
      case 2:
        return answers.gender === '';
      case 4:
        return answers.goals.length === 0;
      case 5:
        return answers.causes.length === 0;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.subtitle}>First things first, what should we call you?</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Enter your name"
              placeholderTextColor={colors.textLighter}
              value={answers.name}
              onChangeText={(text) => setAnswers((prev) => ({ ...prev, name: text }))}
              autoFocus
              returnKeyType="next"
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What is your gender?</Text>
            <Text style={styles.subtitle}>Select your gender identity</Text>

            <View style={styles.genderContainer}>
              {['Male', 'Female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderOption,
                    answers.gender === g && styles.selectedGender,
                  ]}
                  onPress={() => {
                    setAnswers((prev) => ({
                      ...prev,
                      gender: prev.gender === g ? '' : g,
                    }));
                    setSkipPressed(false);
                  }}
                >
                  <View
                    style={[
                      styles.genderIconContainer,
                      answers.gender === g && styles.selectedGenderIcon,
                    ]}
                  >
                    <Ionicons
                      name={g === 'Male' ? 'male' : 'female'}
                      size={width * 0.18}
                      color={
                        answers.gender === g ? colors.buttonText : colors.primary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.genderText,
                      answers.gender === g && styles.selectedText,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.skipButton,
                skipPressed && styles.skipButtonActive,
              ]}
              onPress={() => {
                setAnswers((prev) => ({
                  ...prev,
                  gender:
                    prev.gender === 'Prefer not to say' ? '' : 'Prefer not to say',
                }));
                setSkipPressed(!skipPressed);
              }}
            >
              <Text
                style={[
                  styles.skipText,
                  skipPressed && styles.skipTextActive,
                ]}
              >
                Prefer not to say
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>How old are you?</Text>
            <Text style={styles.subtitle}>Select your age</Text>

            <View style={styles.ageWheelContainer}>
              <View style={styles.selectionIndicator} />
              <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.ageWheelContent}
                snapToInterval={height * 0.085}
                decelerationRate="fast"
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                  const offsetY = e.nativeEvent.contentOffset.y;
                  const index = Math.round(offsetY / (height * 0.085));
                  const selectedAge = ages[index];
                  if (selectedAge) {
                    setAnswers((prev) => ({ ...prev, age: selectedAge }));
                  }
                }}
              >
                {ages.map((item, index) => {
                  const inputRange = [
                    (index - 2) * (height * 0.085),
                    (index - 1) * (height * 0.085),
                    index * (height * 0.085),
                    (index + 1) * (height * 0.085),
                    (index + 2) * (height * 0.085),
                  ];

                  const scale = scrollY.interpolate({
                    inputRange,
                    outputRange: [0.75, 0.88, 1, 0.88, 0.75],
                    extrapolate: 'clamp',
                  });

                  const opacity = scrollY.interpolate({
                    inputRange,
                    outputRange: [0.4, 0.75, 1, 0.75, 0.4],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Animated.View
                      key={item}
                      style={[
                        styles.ageWheelItem,
                        { transform: [{ scale }], opacity },
                      ]}
                    >
                      <View style={styles.ageWheelButton}>
                        <Text
                          style={[
                            styles.ageWheelText,
                            answers.age === item && styles.selectedWheelText,
                          ]}
                        >
                          {item}
                        </Text>
                      </View>
                    </Animated.View>
                  );
                })}
              </Animated.ScrollView>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What are your main goals?</Text>
            <Text style={styles.subtitle}>Select all that apply to you</Text>
            <View style={styles.optionsContainer}>
              {goals.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[styles.option, answers.goals.includes(goal) && styles.selectedOption]}
                  onPress={() => toggleSelection('goals', goal)}>
                  <Text
                    style={[
                      styles.optionText,
                      answers.goals.includes(goal) && styles.selectedText,
                    ]}>
                    {goal}
                  </Text>
                  {answers.goals.includes(goal) && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.buttonText}
                      style={styles.optionCheckIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What contributes to your challenges?</Text>
            <Text style={styles.subtitle}>Select all that apply</Text>
            <View style={styles.optionsContainer}>
              {causes.map((cause) => (
                <TouchableOpacity
                  key={cause}
                  style={[styles.option, answers.causes.includes(cause) && styles.selectedOption]}
                  onPress={() => toggleSelection('causes', cause)}>
                  <Text
                    style={[
                      styles.optionText,
                      answers.causes.includes(cause) && styles.selectedText,
                    ]}>
                    {cause}
                  </Text>
                  {answers.causes.includes(cause) && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.buttonText}
                      style={styles.optionCheckIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!fontsLoaded) return <AppLoading />;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => step > 1 && setStep(step - 1)}
          disabled={step === 1}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={step === 1 ? colors.border : colors.secondary}
          />
        </TouchableOpacity>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: `${(step / 5) * 100}%` }]} />
          </View>
          <Text style={styles.stepText}>{step}/5</Text>
        </View>
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>
      </View>

      {/* Continue + Bottom Skip */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isContinueDisabled() && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isContinueDisabled()}>
          <Text style={styles.buttonText}>{step === 5 ? 'Get Started' : 'Continue'}</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.buttonText} style={styles.buttonIcon} />
        </TouchableOpacity>

        {step < 5 && (
          <TouchableOpacity style={styles.skipBottomButton} onPress={handleSkipAll}>
            <Text style={styles.skipBottomText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default Questionnaire;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.06,
    paddingBottom: height * 0.02,
  },
  backButton: { padding: 8, marginRight: 12 },
  progressContainer: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  progress: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  stepText: {
    fontSize: 16,
    color: colors.textLight,
    fontFamily: FONT.semiBold,
  },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: height * 0.02 },
  stepContainer: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: width * 0.07 },
  title: {
    fontSize: width * 0.07,
    textAlign: 'center',
    color: colors.secondary,
    fontFamily: FONT.bold,
  },
  subtitle: {
    fontSize: width * 0.04,
    textAlign: 'center',
    color: colors.textLight,
    marginBottom: height * 0.04,
    fontFamily: FONT.regular,
  },
  nameInput: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#FCFCFC',
    textAlign: 'center',
    paddingVertical: height * 0.025,
    fontSize: width * 0.07,
    color: colors.secondary,
    marginTop: height * 0.02,
    fontFamily: FONT.semiBold,
  },
  genderContainer: { margin: 50, flexDirection: 'row', justifyContent: 'space-around', width: '100%', maxWidth: 400 },
  genderOption: { alignItems: 'center', width: width * 0.28 },
  genderIconContainer: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#FCFCFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedGenderIcon: { backgroundColor: colors.primary, borderColor: colors.primary },
  genderText: {
    fontSize: width * 0.04,
    color: colors.secondary,
    fontFamily: FONT.medium,
  },
  selectedGender: {},
  skipButton: {
    marginTop: height * 0.02,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderColor: "white",
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.15,
    shadowColor: colors.primary,
  },
  optionsContainer: { width: '100%', maxWidth: 400, marginTop: height * 0.01 },
  option: {
    padding: width * 0.05,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    marginVertical: height * 0.006,
    backgroundColor: '#FCFCFC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: { backgroundColor: colors.background, borderColor: colors.primary, color: colors.primaryDark },
  optionText: {
    color: colors.secondary,
    fontSize: width * 0.042,
    flex: 1,
    textAlign: 'center',
    fontFamily: FONT.medium,
  },
  selectedText: {
    color: colors.secondary,
    fontFamily: FONT.semiBold,
  },
  optionCheckIcon: { marginLeft: 8, color: colors.primary },

  /** AGE WHEEL **/
  ageWheelContainer: {
    height: height * 0.45,
    width: '100%',
    maxWidth: 420,
    marginTop: height * 0.03,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    top: (height * 0.45) / 2 - (height * 0.085) / 2,
    left: '10%',
    right: '10%',
    height: height * 0.085,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    zIndex: 1,
  },
  ageWheelContent: {
    paddingVertical: (height * 0.45) / 2 - (height * 0.085) / 2,
  },
  ageWheelItem: {
    height: height * 0.085,
    alignItems: 'center',
    justifyContent: 'center',
    perspective: 1000,
  },
  ageWheelButton: { alignItems: 'center', justifyContent: 'center' },
  ageWheelText: {
    fontSize: width * 0.1,
    color: colors.secondary,
    fontFamily: FONT.bold,
  },
  selectedWheelText: {
    color: colors.primary,
    fontSize: width * 0.12,
    fontFamily: FONT.extraBold,
  },

  buttonContainer: {
    borderTopWidth: 2,
    borderColor: colors.gray,
    paddingHorizontal: width * 0.07,
    paddingBottom: height * 0.02,
    paddingTop: height * 0.02,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: height * 0.02,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonDisabled: { backgroundColor: colors.gray },
  buttonText: {
    color: colors.buttonText,
    fontSize: width * 0.045,
    fontFamily: FONT.bold,
  },
  buttonIcon: { marginLeft: 8 },

  skipBottomButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  skipBottomText: {
    color: colors.textLighter,
    fontFamily: FONT.medium,
    fontSize: width * 0.04,
  },
});
