import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface SocialLogoProps {
  size?: number;
  color?: string;
}

export function GoogleLogo({ size = 24 }: SocialLogoProps) {
  return (
    <Text style={[styles.googleIcon, { fontSize: size }]}>
      G
    </Text>
  );
}

export function AppleLogo({ size = 24 }: SocialLogoProps) {
  return (
    <Text style={[styles.appleIcon, { fontSize: size }]}>
      
    </Text>
  );
}

const styles = StyleSheet.create({
  googleIcon: {
    fontWeight: '700',
    color: '#4285F4',
  },
  appleIcon: {
    fontWeight: '700',
    fontSize: 20,
  },
});
