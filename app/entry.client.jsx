import {HydratedRouter} from 'react-router/dom';
import {startTransition, StrictMode} from 'react';
import {hydrateRoot} from 'react-dom/client';
// DOCS https://remix.run/docs/en/main/file-conventions/entry.client
if (!window.location.origin.includes('webcache.googleusercontent.com')) {
  startTransition(() => {
    hydrateRoot( // this is the hydration ROOT
      document,
      <StrictMode>
        <HydratedRouter />
      </StrictMode>,
    );
  });
}