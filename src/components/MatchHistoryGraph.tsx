import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';

export interface HistoryItem {
  team: 'us' | 'them';
  points: number;
}

interface MatchHistoryGraphProps {
  history: HistoryItem[];
  colorUs?: string;
  colorThem?: string;
}

export const MatchHistoryGraph = ({ 
  history, 
  colorUs = '#32D74B', 
  colorThem = '#FF453A' 
}: MatchHistoryGraphProps) => {
  
  const scrollViewRef = React.useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      
      {/* A LINHA CENTRAL FIXA (Agora aparece sempre) */}
      <View style={styles.centerLine} />

      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {history.map((item, index) => {
          // Altura: Truco (3 ou 4) é maior que ponto normal (1 ou 2)
          const barHeight = item.points > 2 ? 30 : 16; 
          
          return (
            <View key={index} style={[
                styles.historyDot, 
                { 
                    backgroundColor: item.team === 'us' ? colorUs : colorThem,
                    height: barHeight,
                    // Lógica de Deslocamento:
                    // Se for 'them' (cima), deslocamos para cima (translateY negativo)
                    // Se for 'us' (baixo), deslocamos para baixo (translateY positivo)
                    transform: [
                      { translateY: item.team === 'them' ? -(barHeight / 2 + 2) : (barHeight / 2 + 2) }
                    ]
                } 
            ]} />
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
    position: 'relative'
  },
  
  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2, // Espessura da linha
    backgroundColor: 'rgba(255,255,255,0.15)', // Cor da linha
    zIndex: -1, // Fica atrás dos pontos
    alignSelf: 'center' // Garante o centro vertical
  },

  scrollContent: { 
    alignItems: 'center', // Centraliza os itens verticalmente na linha
    paddingHorizontal: 20, // Espaço nas pontas
    gap: 6 // Espaço entre as barrinhas
  },

  historyDot: { 
    width: 6, 
    borderRadius: 3 
  },
});