import Sidebar from './components/Sidebar';
import MapDisplay from './components/MapDisplay';
import { UIProvider } from './contexts/UIContext';
// @ts-ignore
import activitiesData from './data/strava-activities.json' with { type: 'json' };

function App() {
  const activities = (activitiesData as any[]) || [];
  const latestActivity = activities.length > 0 ? activities[0] : null;
  const currentLocation = latestActivity ? latestActivity.name : 'Unknown';

  return (
    <UIProvider>
      <div style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'var(--bg-color)'
      }}>
        {/* Sidebar - Floating */}
        <Sidebar />

        {/* Main Content Area - Full Screen Map */}
        <main style={{
          flex: 1,
          height: '100%',
          width: '100%',
          position: 'relative'
        }}>
          <MapDisplay />

          
        </main>
      </div>
    </UIProvider>
  );
}

export default App;
