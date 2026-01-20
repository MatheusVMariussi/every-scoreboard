import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';

interface TrucoHelpModalProps {
  visible: boolean;
  onClose: () => void;
  gameMode: 'paulista' | 'mineiro';
}

// Custom shapes for suits might be better if Ionicons doesn't have good suit icons
// But for now, let's stick to text or simple icons.
// Actually, Ionicons has 'heart', 'diamond' (in MD), but 'club' and 'spade' are missing usually.
// I will use text char for suits: ♣ ♥ ♠ ♦

const Card = ({ value, suit, isManilha = false, highlight = false }: { value: string, suit: string, isManilha?: boolean, highlight?: boolean }) => (
  <View style={[styles.card, isManilha && styles.cardManilha, highlight && styles.cardHighlight]}>
    <Text style={[styles.cardValue, { color: suit === '♥' || suit === '♦' ? '#D32F2F' : 'black' }]}>{value}</Text>
    <Text style={[styles.cardSuit, { color: suit === '♥' || suit === '♦' ? '#D32F2F' : 'black' }]}>{suit}</Text>
  </View>
);

export const TrucoHelpModal = ({ visible, onClose, gameMode }: TrucoHelpModalProps) => {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'OBJETIVO',
      content: (
        <View style={styles.stepContainer}>
          <Text style={styles.text}>
            O Truco é disputado em duplas. O objetivo é ser a primeira dupla a alcançar {gameMode === 'paulista' ? '12' : '12'} pontos.
          </Text>
          <Text style={styles.text}>
            A partida é dividida em "Mãos". Cada mão vale inicialmente {gameMode === 'paulista' ? '1' : '2'} ponto(s) e é disputada em uma "melhor de três" rodadas.
          </Text>
          <View style={styles.exampleRow}>
            <View style={styles.miniScoreboard}>
                <Text style={styles.miniScoreTitle}>NÓS</Text>
                <Text style={styles.miniScoreVal}>09</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.miniScoreboard}>
                <Text style={styles.miniScoreTitle}>ELES</Text>
                <Text style={styles.miniScoreVal}>11</Text>
            </View>
          </View>
        </View>
      )
    },
    {
      title: 'FORÇA DAS CARTAS',
      content: (
        <View style={styles.stepContainer}>
          <Text style={styles.text}>
            A hierarquia básica das cartas (da mais forte para a mais fraca) é:
          </Text>
          <View style={styles.cardsRow}>
            <Card value="3" suit="♣" highlight />
            <Card value="2" suit="♦" />
            <Card value="A" suit="♠" />
            <Card value="K" suit="♥" />
            <Card value="J" suit="♣" />
          </View>
          <View style={styles.cardsRow}>
            <Card value="Q" suit="♦" />
            <Card value="7" suit="♠" />
            <Card value="6" suit="♥" />
            <Card value="5" suit="♣" />
            <Card value="4" suit="♦" />
          </View>
          <Text style={styles.note}>
            * No "Baralho Limpo", retiram-se os 7, 6, 5 e 4 (exceto se forem manilhas).
          </Text>
        </View>
      )
    },
    {
      title: 'MANILHAS',
      content: (
        <View style={styles.stepContainer}>
          <Text style={styles.text}>
            As Manilhas são as cartas mais fortes do jogo, superando qualquer outra (inclusive o 3).
          </Text>

          {gameMode === 'paulista' ? (
             <>
                <Text style={styles.subTitle}>Manilha Variável (Vira)</Text>
                <Text style={styles.text}>
                  No Truco Paulista, vira-se uma carta. A manilha será a carta imediatamente superior a ela.
                </Text>
                <View style={styles.exampleBox}>
                   <Text style={styles.exampleText}>Se virar um:</Text>
                   <Card value="A" suit="♥" />
                   <Text style={styles.exampleText}>A manilha é:</Text>
                   <Card value="2" suit="♣" isManilha />
                </View>
                <Text style={styles.text}>Ordem de força (Nipes):</Text>
                <View style={styles.suitsOrder}>
                    <Text style={styles.suitIcon}>♣ (Zap)</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                    <Text style={[styles.suitIcon, {color: '#D32F2F'}]}>♥ (Copas)</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                    <Text style={styles.suitIcon}>♠ (Espadilha)</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                    <Text style={[styles.suitIcon, {color: '#D32F2F'}]}>♦ (Pica-Fumo)</Text>
                </View>
             </>
          ) : (
             <>
                <Text style={styles.subTitle}>Manilhas Fixas</Text>
                <Text style={styles.text}>
                  No Truco Mineiro, as manilhas são sempre as mesmas:
                </Text>
                <View style={styles.cardsRow}>
                  <Card value="4" suit="♣" isManilha />
                  <Card value="7" suit="♥" isManilha />
                  <Card value="A" suit="♠" isManilha />
                  <Card value="7" suit="♦" isManilha />
                </View>
                <Text style={styles.text}>
                   (Zap &gt; 7 Copas &gt; Espadilha &gt; 7 Ouros)
                </Text>
             </>
          )}
        </View>
      )
    },
    {
      title: 'PEDIDOS E PONTOS',
      content: (
        <View style={styles.stepContainer}>
          <Text style={styles.text}>
            A qualquer momento na sua vez, um jogador pode pedir "TRUCO" (ou aumentar a aposta).
          </Text>
          <View style={styles.tablePoints}>
            <View style={styles.rowPoint}>
               <Text style={styles.lbl}>Mão Normal:</Text>
               <Text style={styles.val}>{gameMode === 'paulista' ? '1 tento' : '2 tentos'}</Text>
            </View>
            <View style={styles.rowPoint}>
               <Text style={styles.lbl}>Truco:</Text>
               <Text style={styles.val}>{gameMode === 'paulista' ? '3 tentos' : '4 tentos'}</Text>
            </View>
            <View style={styles.rowPoint}>
               <Text style={styles.lbl}>Seis:</Text>
               <Text style={styles.val}>{gameMode === 'paulista' ? '6 tentos' : '6 tentos'}</Text>
            </View>
            <View style={styles.rowPoint}>
               <Text style={styles.lbl}>Nove:</Text>
               <Text style={styles.val}>{gameMode === 'paulista' ? '9 tentos' : '10 tentos'}</Text>
            </View>
            <View style={styles.rowPoint}>
               <Text style={styles.lbl}>Doze:</Text>
               <Text style={styles.val}>12 tentos</Text>
            </View>
          </View>
          <Text style={styles.text}>
            Se a dupla adversária recusar o pedido, eles perdem a mão e a dupla que pediu ganha os pontos que estavam valendo antes do aumento.
          </Text>
        </View>
      )
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onClose();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: '#F5F5F5' }]}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>COMO JOGAR</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={32} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
             <Text style={styles.stepTitle}>{steps[step].title}</Text>
             {steps[step].content}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
             <TouchableOpacity
                style={[styles.navBtn, step === 0 && styles.disabledBtn]}
                onPress={handleBack}
                disabled={step === 0}
             >
                <Text style={styles.navText}>Anterior</Text>
             </TouchableOpacity>

             <View style={styles.dots}>
                {steps.map((_, i) => (
                    <View key={i} style={[styles.dot, i === step && styles.activeDot]} />
                ))}
             </View>

             <TouchableOpacity style={[styles.navBtn, styles.primaryBtn]} onPress={handleNext}>
                <Text style={[styles.navText, styles.primaryText]}>
                    {step === steps.length - 1 ? 'Entendi' : 'Próximo'}
                </Text>
             </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', maxHeight: '85%', borderRadius: 16, overflow: 'hidden', elevation: 5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: '#FFF' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  scrollContent: { padding: 20 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  stepContainer: { alignItems: 'center' },
  text: { fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 15, textAlign: 'center' },
  note: { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
  subTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 10, marginBottom: 5 },

  // Cards
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 15 },
  card: { width: 44, height: 60, backgroundColor: '#FFF', borderRadius: 4, borderWidth: 1, borderColor: '#CCC', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  cardManilha: { borderColor: '#FFD700', borderWidth: 2, backgroundColor: '#FFFDF0' },
  cardHighlight: { borderColor: '#333', borderWidth: 1.5 },
  cardValue: { fontSize: 18, fontWeight: 'bold' },
  cardSuit: { fontSize: 16 },

  // Examples
  exampleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, marginTop: 10 },
  miniScoreboard: { alignItems: 'center', backgroundColor: '#333', padding: 8, borderRadius: 6 },
  miniScoreTitle: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  miniScoreVal: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  vs: { fontSize: 16, fontWeight: 'bold', color: '#666' },

  exampleBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 10, backgroundColor: '#EFEFEF', padding: 10, borderRadius: 8 },
  exampleText: { fontSize: 14, color: '#333' },

  suitsOrder: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  suitIcon: { fontSize: 16, fontWeight: 'bold' },

  // Points Table
  tablePoints: { width: '100%', backgroundColor: '#FFF', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  rowPoint: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  lbl: { fontWeight: 'bold', color: '#555' },
  val: { color: '#333' },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  navBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  primaryBtn: { backgroundColor: '#333' },
  disabledBtn: { opacity: 0 },
  navText: { fontSize: 16, fontWeight: '600', color: '#333' },
  primaryText: { color: '#FFF' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CCC' },
  activeDot: { backgroundColor: '#333', width: 20 }
});
