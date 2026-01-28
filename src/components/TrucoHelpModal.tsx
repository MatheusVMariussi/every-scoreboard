import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/useTheme';
import { translate } from '../i18n';

interface TrucoHelpModalProps {
  visible: boolean;
  onClose: () => void;
  gameMode: 'paulista' | 'mineiro';
}

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
      title: translate('truco.help.objective_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={styles.text}>
            {translate('truco.help.objective_text_1', { points: '12' })}
          </Text>
          <Text style={styles.text}>
             {translate('truco.help.objective_text_2', { points: gameMode === 'paulista' ? '1' : '2' })}
          </Text>
          <View style={styles.exampleRow}>
            <View style={styles.miniScoreboard}>
                <Text style={styles.miniScoreTitle}>{translate('truco.us')}</Text>
                <Text style={styles.miniScoreVal}>09</Text>
            </View>
            <Text style={styles.vs}>VS</Text>
            <View style={styles.miniScoreboard}>
                <Text style={styles.miniScoreTitle}>{translate('truco.them')}</Text>
                <Text style={styles.miniScoreVal}>11</Text>
            </View>
          </View>
        </View>
      )
    },
    {
      title: translate('truco.help.cards_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={styles.text}>
            {translate('truco.help.cards_text')}
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
            {translate('truco.help.cards_note')}
          </Text>
        </View>
      )
    },
    {
      title: translate('truco.help.manilhas_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={styles.text}>
            {translate('truco.help.manilhas_text')}
          </Text>

          {gameMode === 'paulista' ? (
             <>
                <Text style={styles.subTitle}>{translate('truco.help.manilha_variable_title')}</Text>
                <Text style={styles.text}>
                  {translate('truco.help.manilha_variable_text')}
                </Text>
                <View style={styles.exampleBox}>
                   <Text style={styles.exampleText}>{translate('truco.help.manilha_example_if')}</Text>
                   <Card value="A" suit="♥" />
                   <Text style={styles.exampleText}>{translate('truco.help.manilha_example_is')}</Text>
                   <Card value="2" suit="♣" isManilha />
                </View>
                <Text style={styles.text}>{translate('truco.help.suits_order')}</Text>
                <View style={styles.suitsOrder}>
                    <Text style={styles.suitIcon}>♣ PAUS</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                    <Text style={[styles.suitIcon, {color: '#D32F2F'}]}>♥ COPAS</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                    <Text style={styles.suitIcon}>♠ ESPADA</Text>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                    <Text style={[styles.suitIcon, {color: '#D32F2F'}]}>♦ OURO</Text>
                </View>
             </>
          ) : (
             <>
                <Text style={styles.subTitle}>{translate('truco.help.manilha_fixed_title')}</Text>
                <Text style={styles.text}>
                  {translate('truco.help.manilha_fixed_text')}
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
      title: translate('truco.help.points_title'),
      content: (
        <View style={styles.stepContainer}>
          <Text style={styles.text}>
             {translate('truco.help.points_text')}
          </Text>
          <View style={styles.tablePoints}>
            <View style={styles.rowPoint}>
               <Text style={styles.lbl}>{translate('truco.help.points_table_hand')}</Text>
               <Text style={styles.val}>
                   {gameMode === 'paulista'
                     ? translate('truco.help.tento_one')
                     : translate('truco.help.tentos', { count: 2 })}
               </Text>
            </View>
            <View style={styles.rowPoint}>
               <Text style={styles.lbl}>{translate('truco.help.points_table_truco')}</Text>
               <Text style={styles.val}>{translate('truco.help.tentos', { count: gameMode === 'paulista' ? 3 : 4 })}</Text>
            </View>
            <View style={styles.rowPoint}>
               <Text style={styles.lbl}>{translate('truco.help.points_table_six')}</Text>
               <Text style={styles.val}>{translate('truco.help.tentos', { count: gameMode === 'paulista' ? 6 : 8 })}</Text>
            </View>
            <View style={styles.rowPoint}>
               <Text style={styles.lbl}>{translate('truco.help.points_table_nine')}</Text>
               <Text style={styles.val}>{translate('truco.help.tentos', { count: gameMode === 'paulista' ? 9 : 10 })}</Text>
            </View>
            <View style={styles.rowPoint}>
               <Text style={styles.lbl}>{translate('truco.help.points_table_twelve')}</Text>
               <Text style={styles.val}>{translate('truco.help.tentos', { count: 12 })}</Text>
            </View>
          </View>
          <Text style={styles.text}>
            {translate('truco.help.points_refuse_text')}
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
            <Text style={styles.headerTitle}>{translate('truco.help.title')}</Text>
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
                <Text style={styles.navText}>{translate('common.previous')}</Text>
             </TouchableOpacity>

             <View style={styles.dots}>
                {steps.map((_, i) => (
                    <View key={i} style={[styles.dot, i === step && styles.activeDot]} />
                ))}
             </View>

             <TouchableOpacity style={[styles.navBtn, styles.primaryBtn]} onPress={handleNext}>
                <Text style={[styles.navText, styles.primaryText]}>
                    {step === steps.length - 1 ? translate('common.got_it') : translate('common.next')}
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
  suitIcon: { fontSize: 12, fontWeight: 'bold' },

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
