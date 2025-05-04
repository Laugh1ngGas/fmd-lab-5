import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../index';
import { API_KEY } from '../../src/config/config';

type StatisticsRouteProp = RouteProp<RootStackParamList, 'Statistics'>;

type Rates = {
  USD: number;
  EUR: number;
  PLN: number;
};

const StatisticsScreen = () => {
  const { params } = useRoute<StatisticsRouteProp>();
  const { totalIncome, totalExpenses, balance, currency: baseCurrency } = params;

  const [currency, setCurrency] = useState<'UAH' | 'USD' | 'EUR' | 'PLN'>(baseCurrency);
  const [rates, setRates] = useState<Rates | null>(null);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const response = await fetch(
        `https://api.currencyfreaks.com/latest?apikey=${API_KEY}&symbols=UAH,USD,EUR,PLN`
      );
      const data = await response.json();
      const baseToUAH = parseFloat(data.rates.UAH);
      const usd = baseToUAH / parseFloat(data.rates.USD);
      const eur = baseToUAH / parseFloat(data.rates.EUR);
      const pln = baseToUAH / parseFloat(data.rates.PLN);

      setRates({ USD: usd, EUR: eur, PLN: pln });
    } catch (error) {
      console.error('Failed to fetch rates', error);
    }
  };

  const convert = (amountUAH: number): number => {
    if (currency === 'UAH' || !rates) return amountUAH;
    return +(amountUAH / rates[currency]).toFixed(2);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics</Text>

      <Text style={styles.label}>Display Currency:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={currency}
          onValueChange={(value) => setCurrency(value)}
          style={styles.picker}
        >
          <Picker.Item label="UAH (₴)" value="UAH" />
          <Picker.Item label="USD ($)" value="USD" />
          <Picker.Item label="EUR (€)" value="EUR" />
          <Picker.Item label="PLN (zł)" value="PLN" />
        </Picker>
      </View>

      <Text>Total Income: {convert(totalIncome)} {currency}</Text>
      <Text>Total Expenses: {convert(totalExpenses)} {currency}</Text>
      <Text>Balance: {convert(balance)} {currency}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
});

export default StatisticsScreen;
