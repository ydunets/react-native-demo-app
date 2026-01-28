import { Redirect } from 'expo-router';
import { useIsLoggedIn } from '@/stores/auth';
import RoutePaths from '../router-map/routes';

export default function Index() {
  const isLoggedIn = useIsLoggedIn();

  if (isLoggedIn) {
    return <Redirect href={RoutePaths.HomeScreen} />;
  }

  return <Redirect href="/(auth)/login" />;
}
