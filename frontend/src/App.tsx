import { useState, useEffect } from 'react';
import { SiteHeader } from './components/layout/SiteHeader';
import { SiteFooter } from './components/layout/SiteFooter';
import { LandingPage } from './features/landing/LandingPage';
import { DashboardPage } from './features/dashboard/DashboardPage';

export function App() {
  const getInitialView = (): 'landing' | 'dashboard' => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    if (hash === '#dashboard' || path.includes('/dashboard')) {
      return 'dashboard';
    }
    return 'landing';
  };

  const [view, setView] = useState<'landing' | 'dashboard'>(getInitialView);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#dashboard') {
        setView('dashboard');
      } else if (hash === '' || hash === '#landing' || hash === '#workflow' || hash === '#capabilities') {
        setView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToDashboard = () => {
    window.location.hash = '#dashboard';
    setView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToLanding = () => {
    window.location.hash = '';
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-shell">
      <SiteHeader
        activeView={view}
        onOpenDashboard={navigateToDashboard}
        onNavigateLanding={navigateToLanding}
      />

      <main className="app-main">
        {view === 'landing' ? (
          <LandingPage onOpenDashboard={navigateToDashboard} />
        ) : (
          <DashboardPage />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

export default App;
