import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../index';
import { API_KEY } from '../../src/config/config';

type Operation = {
  id: string;
  amount: number;
  category: string;
  type: 'Income' | 'Expense';
};

type Rates = {
  USD: number;
  EUR: number;
  PLN: number;
};

const FinanceManager: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('Salary');
  const [isIncome, setIsIncome] = useState<boolean>(true);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [currency, setCurrency] = useState<'UAH' | 'USD' | 'EUR' | 'PLN'>('UAH');
  const [rates, setRates] = useState<Rates | null>(null);
  const [loadingRates, setLoadingRates] = useState<boolean>(true);

  useEffect(() => {
    loadOperations();
    fetchRates();
  }, []);

  useEffect(() => {
    saveOperations();
  }, [operations]);

  const saveOperations = async () => {
    try {
      await AsyncStorage.setItem('operations', JSON.stringify(operations));
    } catch (e) {
      console.error('Failed to save operations:', e);
    }
  };

  const loadOperations = async () => {
    try {
      const data = await AsyncStorage.getItem('operations');
      if (data) {
        setOperations(JSON.parse(data));
      }
    } catch (e) {
      console.error('Failed to load operations:', e);
    }
  };

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
      console.error('Failed to fetch exchange rates:', error);
    } finally {
      setLoadingRates(false);
    }
  };

  const convert = (amount: number): number => {
    if (currency === 'UAH') return amount;
    if (!rates) return amount;
    return +(amount / rates[currency]).toFixed(2);
  };

  const handleAddOperation = () => {
    if (!amount) return;
  
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return;
  
    const amountInUAH =
      currency === 'UAH' || !rates
        ? parsedAmount
        : parsedAmount * rates[currency];
  
    const newOperation: Operation = {
      id: Math.random().toString(),
      amount: amountInUAH,
      category,
      type: isIncome ? 'Income' : 'Expense',
    };
  
    setOperations((prevOps) => [...prevOps, newOperation]);
    setAmount('');
  };
  

  const handleDeleteOperation = (id: string) => {
    setOperations((ops) => ops.filter((op) => op.id !== id));
  };

  const totalIncomeUAH = operations
    .filter((op) => op.type === 'Income')
    .reduce((sum, op) => sum + op.amount, 0);

  const totalExpensesUAH = operations
    .filter((op) => op.type === 'Expense')
    .reduce((sum, op) => sum + op.amount, 0);

  const balanceUAH = totalIncomeUAH - totalExpensesUAH;

  return (
    <View style={styles.container}>
    <ScrollView>
      <Text style={styles.title}>Finance Manager</Text>

      {loadingRates ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={styles.currencyLabel}>Select currency:</Text>
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


          <View style={styles.inputSection}>
            <Text>Amount ({currency})</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Salary" value="Salary" />
                <Picker.Item label="Food" value="Food" />
                <Picker.Item label="Transport" value="Transport" />
              </Picker>
            </View>

            <View style={styles.toggleContainer}>
              <View style={styles.toggleButton}>
                <Button
                  title="Income"
                  color={isIncome ? 'green' : 'grey'}
                  onPress={() => setIsIncome(true)}
                />
              </View>
              <View style={styles.toggleButton}>
                <Button
                  title="Expense"
                  color={!isIncome ? 'red' : 'grey'}
                  onPress={() => setIsIncome(false)}
                />
              </View>
            </View>

            <Button title="Add Operation" onPress={handleAddOperation} />
          </View>

          <Text>Operations</Text>
          <ScrollView>
          <FlatList<Operation>
            data={operations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.operationItem}>
                <Text
                  style={[
                    styles.operationText,
                    { color: item.type === 'Income' ? 'green' : 'red' },
                  ]}
                  onLongPress={() => handleDeleteOperation(item.id)}
                >
                  {item.type === 'Income'
                    ? `+${convert(item.amount)} ${currency}`
                    : `-${convert(item.amount)} ${currency}`} ({item.category})
                </Text>
              </View>
            )}
          />
          </ScrollView>

          <View style={styles.statsSection}>
            <Text>Income: {convert(totalIncomeUAH)} {currency}</Text>
            <Text>Expense: {convert(totalExpensesUAH)} {currency}</Text>
            <Text>Balance: {convert(balanceUAH)} {currency}</Text>
          </View>

          <View style={styles.statisticsButton}>
            <Button
            title="Statistics"
            onPress={() =>
              navigation.navigate('Statistics', {
                totalIncome: convert(totalIncomeUAH),
                totalExpenses: convert(totalExpensesUAH),
                balance: convert(balanceUAH),
              })
            }
            />
          </View>
          
        </>
      )}
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  toggleContainer: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 10,
  },
  toggleButton : {
    flex: 1,
  },
  operationItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  operationText: {
    fontSize: 18,
  },
  statsSection: {
    marginTop: 20,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  currencyLabel: {
    fontSize: 18,
    marginVertical: 10,
  },
  statisticsButton: {
    marginTop: 20,
  },
});

export default FinanceManager;
