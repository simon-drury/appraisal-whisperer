import { AppraisalMapperAgent } from '@/components/AppraisalMapperAgent';
import { MultiagentEvent } from '@/types/sfl';

const Index = () => {
  const handleAnalysisComplete = (event: MultiagentEvent) => {
    console.log('Multiagent Event:', event);
    // In a full orchestration system, this would route to other agents
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      <div className="container mx-auto py-8">
        <AppraisalMapperAgent 
          onAnalysisComplete={handleAnalysisComplete}
          agentMode="orchestrated"
        />
      </div>
    </div>
  );
};

export default Index;
