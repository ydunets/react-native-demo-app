export type ServiceSummary = {
  id: string;
  name: string;
  description: string;
};

export type ServiceDetails = {
  name: string;
  details: string;
};

export const PILLARS: ServiceSummary[] = [
  { id: '1', name: 'Mental Health', description: 'Mental health services and support' },
  { id: '2', name: 'Physical Health', description: 'Physical wellness programs' },
  { id: '3', name: 'Nutrition', description: 'Nutritional guidance and meal plans' },
];

export const SERVICE_CONTENT: Record<string, ServiceDetails> = {
  '1': {
    name: 'Mental Health',
    details:
      'Comprehensive mental health services including counseling, therapy sessions, and support groups. Our team of licensed professionals is here to help you on your journey.',
  },
  '2': {
    name: 'Physical Health',
    details:
      'Physical wellness programs designed to improve your overall health. Includes fitness plans, health screenings, and personalized workout routines.',
  },
  '3': {
    name: 'Nutrition',
    details:
      'Expert nutritional guidance and personalized meal plans. Learn about healthy eating habits and get recipes tailored to your dietary needs.',
  },
};
