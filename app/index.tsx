import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { Redirect, type Href } from 'expo-router';
import { useAuth } from '@/providers/auth-provider';

export default function IndexScreen() {
  const { ready, user } = useAuth(); 
  const [splashDone, setSplashDone] = useState(false);
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const tigerOpacity = useRef(new Animated.Value(0)).current;
  const tigerScale = useRef(new Animated.Value(0.55)).current;
  const tigerTranslateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(tigerOpacity, {
          toValue: 1,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(tigerScale, {
          toValue: 1.08,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tigerTranslateY, {
          toValue: -6,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(tigerScale, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(tigerTranslateY, {
          toValue: 0,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(400),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => setSplashDone(true));
  }, [containerOpacity, tigerOpacity, tigerScale, tigerTranslateY]);

  if (!ready || !splashDone) {
    return (
      <Animated.View style={[styles.splash, { opacity: containerOpacity }]}>
        <Animated.Image
          source={require('../assets/images/tenrang1.png')}
          style={[
            styles.tiger,
            {
              opacity: tigerOpacity,
              transform: [{ translateY: tigerTranslateY }, { scale: tigerScale }],
            },
          ]}
          resizeMode="contain"
        />
      </Animated.View>
    );
  }

  return <Redirect href={(user ? '/(tabs)' : '/login') as Href} />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090A0F',
  },
  tiger: {
    width: 100,
    height: 100,
  },
});
