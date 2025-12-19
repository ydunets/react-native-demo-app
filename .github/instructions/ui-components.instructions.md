---
applyTo: "components/nativewindui/**/*.tsx"
description: "Instructions for creating and modifying reusable UI components using NativeWind and CVA"
name: "ui-components"
---

# UI Component Guidelines

Follow these patterns when working with reusable components in `components/nativewindui/`.

## Architecture & Styling
- **CVA Pattern**: Use `class-variance-authority` to define style variants.
- **NativeWind**: Use utility classes for all styling.
- **Class Merging**: Always accept a `className` prop and merge it using `cn()`.
- **Theme Awareness**: Use `useColorScheme()` hook if logic depends on the theme, but prefer Tailwind classes (e.g., `dark:bg-black`) for styling.

## Component Structure Template

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

const componentVariants = cva('base-classes', {
  variants: {
    variant: {
      default: 'bg-primary',
      secondary: 'bg-secondary',
    },
    size: {
      sm: 'p-2',
      lg: 'p-4',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'sm',
  },
});

interface ComponentProps extends ViewProps, VariantProps<typeof componentVariants> {}

export function Component({ className, variant, size, ...props }: ComponentProps) {
  return (
    <View 
      className={cn(componentVariants({ variant, size }), className)} 
      {...props} 
    />
  );
}
```

## Best Practices
- **Platform Specifics**: Use `ios:` and `android:` prefixes for platform-specific adjustments.
- **Accessibility**: Ensure components forward accessibility props.
- **Icons**: Use `Icon` component from `@/components/nativewindui/Icon` if needed.
- **Exports**: Export the component as a named export.
