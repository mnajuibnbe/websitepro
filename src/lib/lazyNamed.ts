import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export function lazyNamed<T extends Record<string, unknown>, K extends keyof T>(
  importer: () => Promise<T>,
  name: K,
): LazyExoticComponent<ComponentType<any>> {
  return lazy(async () => ({ default: (await importer())[name] as ComponentType<any> }));
}
