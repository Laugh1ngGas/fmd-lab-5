import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FinanceManager from '../app/components/FinanceManager';
import StatisticsScreen from '../app/components/StatisticsScreen';

export type RootStackParamList = {
  Home: undefined;
  Statistics: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Index() {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={FinanceManager} options={{ title: 'Home' }} />
      <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: 'Statistics' }} />
    </Stack.Navigator>
  );
}
