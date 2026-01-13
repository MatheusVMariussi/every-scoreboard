import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';
import { useScreenOrientation } from '../hooks/useScreenOrientation';

export const CanastraScreen = () => {
  useScreenOrientation('LANDSCAPE');
  const { theme } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({ title: translate('home.canastra') });
  }, [navigation]);

  return (
    <ScreenWrapper style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        Placar de Canastra
      </Text>
      <Text style={{ color: theme.colors.text.secondary }}>
        (Em construção)
      </Text>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});