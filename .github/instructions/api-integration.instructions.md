---
applyTo: "api/**/*.{ts,tsx}"
description: "Instructions for API integration and data fetching"
name: "api-integration"
---

# API Integration Guidelines

Follow these patterns when working with API files in `api/`.

## Architecture
- **Client**: Use the configured axios client from `@/api/axios-client`.
- **Paths**: Use `createControllerPaths` helper for organizing endpoints.
- **React Query**: Use React Query for data fetching hooks.

## Endpoint Definition Template

```typescript
import { createControllerPaths } from './index';

// Define paths
export const getServicePaths = (params: { id?: string } = {}) => {
  const controller = '/service/v1';
  return createControllerPaths(controller, {
    details: `/${params.id || '{id}'}/details`,
    list: '/list',
  });
};
```

## Data Fetching Hook Template

```tsx
import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/api/axios-client';

export const useServiceData = (id: string) => {
  return useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/service/v1/${id}/details`);
      return data;
    },
  });
};
```

## Best Practices
- **Types**: Define TypeScript interfaces for all API responses.
- **Error Handling**: Allow `axios-client` interceptors to handle global errors (auth, network), handle specific business errors in the hook or component.
- **Keys**: Use consistent query key factories (e.g., `['entity', id]`).
