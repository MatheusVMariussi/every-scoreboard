import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/useTheme';

export type HistoryItem = {
  team: 'us' | 'them';
  points: number;
};

interface MatchHistoryGraphProps {
  history: HistoryItem[];
}

export const MatchHistoryGraph = ({ history }: MatchHistoryGraphProps) => {
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  // Cada ponto vale X pixels de altura.
  // Truco (3) = 3 * 6px = 18px de altura visual
  const BLOCK_HEIGHT = 5; 
  const GAP_SIZE = 1; // Espaço entre os tijolinhos

  return (
    <View style={styles.container}>
      {/* Linha Central */}
      <View style={[styles.centerLine, { backgroundColor: theme.colors.modal.divider }]} />
      
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {history.map((item, index) => {
          const isUs = item.team === 'us';
          
          // Criamos um array vazio com o tamanho dos pontos para fazer o map
          // Ex: 3 pontos = [0, 1, 2] -> Gera 3 tijolinhos
          const blocks = Array.from({ length: item.points });

          return (
            <View key={index} style={styles.columnWrapper}>
              
              {/* ÁREA SUPERIOR - ELES (THEM) */}
              <View style={styles.halfContainer}>
                {!isUs && (
                  <View style={styles.stackColumn}>
                    {/* Renderiza blocos de baixo para cima (flex-end) */}
                    {blocks.map((_, i) => (
                      <View 
                        key={i}
                        style={[
                          styles.block, 
                          { 
                            backgroundColor: theme.colors.truco.graphBarThem,
                            marginBottom: i < blocks.length - 1 ? GAP_SIZE : 0, // Espaço entre blocos
                            opacity: 0.9
                          }
                        ]} 
                      />
                    ))}
                  </View>
                )}
              </View>

              {/* ÁREA INFERIOR - NÓS (US) */}
              <View style={[styles.halfContainer, { justifyContent: 'flex-start' }]}>
                {isUs && (
                  <View style={[styles.stackColumn, { justifyContent: 'flex-start' }]}>
                     {/* Renderiza blocos de cima para baixo */}
                     {blocks.map((_, i) => (
                      <View 
                        key={i}
                        style={[
                          styles.block, 
                          { 
                            backgroundColor: theme.colors.truco.graphBarUs,
                            marginTop: i < blocks.length - 1 ? GAP_SIZE : 0,
                          }
                        ]} 
                      />
                    ))}
                  </View>
                )}
              </View>
              
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 70, // Aumentei um pouco para caber 12 pontos se alguém for louco (12*6 = 72px)
    width: '100%',
    justifyContent: 'center',
    marginVertical: 4,
  },
  centerLine: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    height: 1,
    zIndex: 0,
    opacity: 0.4,
  },
  scrollContent: {
    paddingHorizontal: '50%',
    minWidth: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  columnWrapper: {
    height: '100%',
    width: 12, // Um pouco mais largo para acomodar os blocos
    justifyContent: 'center',
    alignItems: 'center',
  },
  halfContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 2, // Pequeno afastamento da linha central
  },
  stackColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  block: {
    width: 8,
    height: 5, // Altura de cada "ponto" visual
    borderRadius: 1,
  }
});