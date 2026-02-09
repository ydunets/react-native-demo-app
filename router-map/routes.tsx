enum RoutePaths {
  WelcomeScreen = '/welcome',
  LoginScreen = '/login',
  RegistrationScreen = '/registration',
  HomeScreen = '/(main)/(tabs)/(services)/services',
  ServiceScreen = '/services/[service]',
  LockScreen = '/lock',
  StrongerMinds = '/stronger-minds',
  Chat = '/chat',
  ChatListScreen = '/(main)/(tabs)/(chat)/chat',
  ChatDetailScreen = '/(main)/(tabs)/(chat)/[id]',
  ChatNewScreen = '/(main)/(tabs)/(chat)/new',
  SendMessage = '/send-message',
  MessageScreen = '/message/[id]',
  Sitemap = '/_sitemap',
}

export default RoutePaths;
