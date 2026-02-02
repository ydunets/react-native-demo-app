import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import RoutePaths from '../router-map/routes';

export default function Index() {
  const { isLoggedIn } = useAuthStore();

  if (isLoggedIn) {
    return <Redirect href={RoutePaths.HomeScreen} />;
  }

  return <Redirect href="/(auth)/login" />;
}
