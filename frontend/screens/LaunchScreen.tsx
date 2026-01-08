import React, { useEffect, useState } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { colors } from '@/styles/colors';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LaunchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isVideoComplete, setIsVideoComplete] = useState(false);

  const player = useVideoPlayer(require('../assets/coderx-launch-high-res.mp4'), (player) => {
    player.loop = false;
    player.play();
  });

  useEffect(() => {
    // Set a maximum timeout to ensure we don't get stuck on launch screen
    const timeout = setTimeout(() => {
      navigateToMain();
    }, 10000); // 10 seconds max

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const subscription = player.addListener('playingChange', (newStatus) => {
      if (!newStatus.isPlaying && player.currentTime >= player.duration - 0.1) {
        navigateToMain();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  const navigateToMain = () => {
    if (!isVideoComplete) {
      setIsVideoComplete(true);
      navigation.replace('MainTabs');
    }
  };

  const handleSkip = () => {
    navigateToMain();
  };

  return (
    <Pressable style={styles.container} onPress={handleSkip}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
        accessible={true}
        accessibilityLabel="Launch animation"
        accessibilityHint="Tap anywhere to skip"
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
  },
});
