import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { HealthCheckSchema } from '@nutrisync/shared';

// Proves packages/shared is wired up end-to-end: parsing a sample payload
// with the same Zod schema the api's /health route uses.
const sharedPackageWorks = HealthCheckSchema.safeParse({
  status: 'ok',
  uptime: 0,
  timestamp: new Date().toISOString(),
}).success;

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NutriSync</Text>
      <Text>apps/mobile skeleton — Expo</Text>
      <Text style={styles.dim}>
        @nutrisync/shared: {sharedPackageWorks ? 'wired up ✅' : 'not working ❌'}
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
  dim: {
    color: '#888',
    fontSize: 12,
  },
});
