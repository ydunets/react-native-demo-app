import { Redirect } from 'expo-router';
import RoutePaths from '../router-map/routes';

export default function Index() {
  // Redirect to login screen
  return <Redirect href={RoutePaths.HomeScreen} />;
}
