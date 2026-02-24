import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translate } from '../i18n';
import { clearAllData } from '../utils/storage';
import { ms } from '../theme/responsive';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleTryAgain = () => {
    this.setState({ hasError: false });
  };

  handleResetData = () => {
    Alert.alert(translate('common.error_reset'), translate('common.error_reset_confirm'), [
      { text: translate('common.cancel'), style: 'cancel' },
      {
        text: translate('common.confirm'),
        style: 'destructive',
        onPress: () => {
          clearAllData().then(() => {
            this.setState({ hasError: false });
          });
        },
      },
    ]);
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="warning-outline" size={ms(64)} color="#FF3B30" />
          <Text style={styles.title}>{translate('common.error_title')}</Text>
          <Text style={styles.message}>{translate('common.error_message')}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={this.handleTryAgain}>
            <Text style={styles.primaryButtonText}>{translate('common.error_try_again')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={this.handleResetData}>
            <Text style={styles.secondaryButtonText}>{translate('common.error_reset')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090910',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ms(32),
  },
  title: {
    fontFamily: 'Minecraft',
    fontSize: ms(20),
    color: '#FFFFFF',
    marginTop: ms(24),
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Minecraft',
    fontSize: ms(10),
    color: 'rgba(255,255,255,0.6)',
    marginTop: ms(12),
    textAlign: 'center',
    lineHeight: ms(18),
  },
  primaryButton: {
    backgroundColor: '#00F0FF',
    paddingHorizontal: ms(32),
    paddingVertical: ms(14),
    borderRadius: ms(8),
    marginTop: ms(32),
  },
  primaryButtonText: {
    fontFamily: 'Minecraft',
    fontSize: ms(12),
    color: '#090910',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingHorizontal: ms(32),
    paddingVertical: ms(14),
    borderRadius: ms(8),
    marginTop: ms(16),
  },
  secondaryButtonText: {
    fontFamily: 'Minecraft',
    fontSize: ms(10),
    color: '#FF3B30',
  },
});
