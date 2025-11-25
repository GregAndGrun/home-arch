import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { GateState, GateType } from '../types';

interface GateCardProps {
  title: string;
  gateType: GateType;
  state: GateState;
  onTrigger: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const GateCard: React.FC<GateCardProps> = ({
  title,
  gateType,
  state,
  onTrigger,
  loading = false,
  disabled = false,
}) => {
  const getStateColor = () => {
    switch (state) {
      case GateState.OPEN:
        return '#4CAF50';
      case GateState.CLOSED:
        return '#F44336';
      case GateState.OPENING:
      case GateState.CLOSING:
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const getStateText = () => {
    switch (state) {
      case GateState.OPEN:
        return 'Open';
      case GateState.CLOSED:
        return 'Closed';
      case GateState.OPENING:
        return 'Opening...';
      case GateState.CLOSING:
        return 'Closing...';
      default:
        return 'Unknown';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={[styles.stateBadge, { backgroundColor: getStateColor() }]}>
          <Text style={styles.stateText}>{getStateText()}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          disabled && styles.buttonDisabled,
        ]}
        onPress={onTrigger}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Toggle Gate</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 0, // Kwadratowy design
    padding: 20,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  stateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0, // Kwadratowy
  },
  stateText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 0, // Kwadratowy
    padding: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#BDBDBD',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GateCard;

