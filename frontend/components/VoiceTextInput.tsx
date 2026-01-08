import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Alert, ActivityIndicator } from 'react-native';
import Voice from '@react-native-voice/voice';
import { Mic, MicOff } from 'lucide-react-native';
import { colors } from '@/styles/colors';
import { spacing, touchTarget, fontSize } from '@/styles/spacing';
import textAnalysisAPI from '@/services/text-analysis-api';

interface VoiceTextInputProps {
  onSuccess?: (text: string) => void;
  onError?: (error: string) => void;
}

const LISTENING_TIMEOUT_MS = 10 * 1000; // 10 seconds

export const VoiceTextInput: React.FC<VoiceTextInputProps> = ({ onSuccess, onError }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const listeningTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Voice event listeners
    Voice.onSpeechStart = () => {
      console.log('Speech started');
    };

    Voice.onSpeechResults = (e: any) => {
      if (e.value && e.value[0]) {
        setText(e.value[0]);
      }
    };

    Voice.onSpeechError = (e: any) => {
      console.error('Speech error:', e);
      setIsListening(false);
      // Alert.alert('Speech Error', 'Failed to recognize speech. Please try again.');
    };

    return () => {
      // Cleanup timer on unmount
      if (listeningTimerRef.current) {
        clearTimeout(listeningTimerRef.current);
      }
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const startListening = async () => {
    try {
      setText(''); // Clear previous text
      setIsListening(true);
      await Voice.start('en-US');

      // Auto-stop after 3 seconds
      listeningTimerRef.current = setTimeout(() => {
        stopListening();
      }, LISTENING_TIMEOUT_MS);
    } catch (error) {
      console.error('Start listening error:', error);
      setIsListening(false);
      Alert.alert('Error', 'Failed to start voice recognition');
    }
  };

  const stopListening = async () => {
    try {
      // Clear the auto-stop timer
      if (listeningTimerRef.current) {
        clearTimeout(listeningTimerRef.current);
        listeningTimerRef.current = null;
      }

      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Stop listening error:', error);
      setIsListening(false);
    }
  };

  const handleSubmit = async () => {
    if (!text.trim()) {
      Alert.alert('Empty Input', 'Please enter or speak some text first.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await textAnalysisAPI.analyzeAndUpdate(text);

      if (result.updateResults.success.length == 0 && result.updateResults.errors.length > 0) {
        const errorMessages = result.updateResults.errors.join('\n');
        Alert.alert('Failure in processing your request', errorMessages);
      } else if (result.updateResults.success.length > 0 && result.updateResults.errors.length > 0) {
        const successMessages = result.updateResults.success.join('\n');
        const errorMessages = result.updateResults.errors.join('\n');
        Alert.alert(
          'Partial Success',
          `Some items were updated successfully:\n${successMessages}\n\nBut some errors occurred:\n${errorMessages}`
        );
      } else if (result.updateResults.success.length > 0 && result.updateResults.errors.length == 0) {
        console.log('Update success:', result.updateResults.success);
        const successMessage = result.updateResults.success
          .map((item) => `${item.item_name}: ${item.quantity}`)
          .join('\n');
        Alert.alert('Updated inventory successfully! Current stock:', `${successMessage}`);
        onSuccess?.(text);
        setText(''); // Clear input on success
      } else {
        Alert.alert('No Updates', 'No inventory updates were made.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      Alert.alert('Error', 'Failed to process your request. Please try again.');
      onError?.(String(error));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Update Supplies</Text>
      <Text style={styles.hint}>"I used 5 adult wet wipes" or "Add 10 catheter kit"</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          placeholder="Type or speak..."
          placeholderTextColor={colors.textSecondary}
          multiline
          editable={!isListening && !isProcessing}
          accessible={true}
          accessibilityLabel="Text input for inventory commands"
          accessibilityHint="Type a command like 'I used 2 catheters' or use the microphone button"
        />

        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micButtonActive, isProcessing && styles.micButtonDisabled]}
          onPress={isListening ? stopListening : startListening}
          disabled={isProcessing}
          accessible={true}
          accessibilityLabel={isListening ? 'Stop recording' : 'Start recording'}
          accessibilityRole="button"
        >
          {isListening ? (
            <MicOff size={24} color={colors.textOnDanger} />
          ) : (
            <Mic size={24} color={colors.textOnPrimary} />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isProcessing && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isProcessing || !text.trim()}
        accessible={true}
        accessibilityLabel="Submit command"
        accessibilityRole="button"
      >
        {isProcessing ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  label: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  hint: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 60,
    maxHeight: 120,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.background,
    textAlignVertical: 'top',
  },
  micButton: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    borderRadius: touchTarget.comfortable / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButtonActive: {
    backgroundColor: colors.danger,
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  listeningContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  lottieAnimation: {
    width: 100,
    height: 100,
  },
  listeningText: {
    fontSize: fontSize.body,
    color: colors.danger,
    fontWeight: '600',
  },
  submitButton: {
    height: touchTarget.large,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: fontSize.large,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
  },
});
