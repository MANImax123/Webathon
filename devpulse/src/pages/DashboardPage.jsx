import { useState } from 'react';
import Sidebar from '../components/shared/Sidebar';
import Navbar from '../components/shared/Navbar';
import HealthRadar from '../components/dashboard/HealthRadar';
import ActiveWorkMap from '../components/dashboard/ActiveWorkMap';
import BlockerAlerts from '../components/dashboard/BlockerAlerts';
import IntegrationRiskGraph from '../components/dashboard/IntegrationRiskGraph';
import BusFactorHeatmap from '../components/dashboard/BusFactorHeatmap';
import SimulationPanel from '../components/dashboard/SimulationPanel';
import AIAdvisor from '../components/dashboard/AIAdvisor';
import CheckpointPanel from '../components/dashboard/CheckpointPanel';
import SemanticSearch from '../components/dashboard/SemanticSearch';

const SECTIONS = {
  health: { title: 'Health Radar', subtitle: 'Overall project health and team velocity', component: HealthRadar },
  workmap: { title: 'Active Work Map', subtitle: 'Real-time view of who\'s doing what', component: ActiveWorkMap },
  blockers: { title: 'Blocker Alerts', subtitle: 'Detected blockers and ghosting patterns', component: BlockerAlerts },
  integration: { title: 'Integration Risk', subtitle: 'Module dependency and integration status', component: IntegrationRiskGraph },
  busfactor: { title: 'Bus Factor Heatmap', subtitle: 'Knowledge concentration risk per module', component: BusFactorHeatmap },
  simulation: { title: 'Delivery Risk Simulator', subtitle: 'Predict future project health with what-if scenarios', component: SimulationPanel },
  advisor: { title: 'AI Project Advisor', subtitle: 'Ask questions about your project status', component: AIAdvisor },
  search: { title: 'Semantic Search', subtitle: 'AI-powered search across your entire workspace', component: SemanticSearch },
  checkpoints: { title: 'Checkpoints & Tasks', subtitle: 'Allocate work, set deadlines, and monitor collaborator progress', component: CheckpointPanel },
};

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState('health');

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const ActiveComponent = SECTIONS[activeSection]?.component;

  return (
    <div className="min-h-screen bg-background">
      <div className="grid-background" />
      <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />

      <div className="ml-64">
        <Navbar />

        <main className="p-6 lg:p-8">
          {/* Section Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-foreground mb-2">{SECTIONS[activeSection]?.title}</h1>
            <p className="text-base text-muted-foreground">{SECTIONS[activeSection]?.subtitle}</p>
          </div>

          {/* Active Panel */}
          <div className="animate-slide-up" key={activeSection}>
            {ActiveComponent && <ActiveComponent />}
          </div>
        </main>
      </div>
    </div>
  );
}
