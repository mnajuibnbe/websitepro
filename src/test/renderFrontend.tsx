import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

interface RenderFrontendOptions {
  route?: string;
}

/**
 * Dependency-free component renderer for structural frontend tests.
 * Interaction tests should use the future DOM/browser harness when it is available.
 */
export function renderFrontend(element: ReactElement, options: RenderFrontendOptions = {}) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[options.route ?? '/']}>{element}</MemoryRouter>,
  );
}
