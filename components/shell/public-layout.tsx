import type { ReactNode } from 'react';
import { PublicNav } from './public-nav';
import { PublicFooter } from './public-footer';

export function PublicLayout({ children, currentPath }: { children: ReactNode; currentPath?: string }) {
  return (
    <>
      <PublicNav currentPath={currentPath} />
      <main>{children}</main>
      <PublicFooter />
    </>
  );
}
