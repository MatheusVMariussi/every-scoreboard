import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { ms } from '../theme/responsive';

export interface HistoryItem {
  id: string;
  team: 'us' | 'them';
  points: number;
}

interface MatchHistoryGraphProps {
  history: HistoryItem[];
  colorUs?: string;
  colorThem?: string;
}

export const MatchHistoryGraph = ({ history, colorUs, colorThem }: MatchHistoryGraphProps) => {
  const { theme } = useTheme();

  const finalColorUs = colorUs || theme.colors.truco.teamUs;
  const finalColorThem = colorThem || theme.colors.truco.teamThem;

  const scrollViewRef = React.useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      {/* A LINHA CENTRAL FIXA */}
      <View style={[styles.centerLine, { backgroundColor: theme.colors.truco.divider }]} />

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }}
      >
        {history.map((item) => {
          const barHeight = item.points > 2 ? ms(30) : ms(16);

          return (
            <View
              key={item.id}
              style={[
                styles.historyDot,
                {
                  backgroundColor: item.team === 'us' ? finalColorUs : finalColorThem,
                  height: barHeight,
                  transform: [
                    { translateY: item.team === 'them' ? -(barHeight / 2 + 2) : barHeight / 2 + 2 },
                  ],
                },
              ]}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },

  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    zIndex: -1,
    alignSelf: 'center',
  },

  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: ms(20),
    gap: ms(6),
  },

  historyDot: {
    width: ms(6),
    borderRadius: ms(3),
  },
});
