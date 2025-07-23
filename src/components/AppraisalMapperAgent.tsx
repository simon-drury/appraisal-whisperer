import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SFLAnalysis, MultiagentEvent } from '@/types/sfl';
import { SFLAnalysisService } from '@/services/sflAnalysisService';
import { Loader2, Brain, Network, Map, Zap } from 'lucide-react';

interface AppraisalMapperAgentProps {
  onAnalysisComplete?: (event: MultiagentEvent) => void;
  agentMode?: 'standalone' | 'orchestrated';
}

export const AppraisalMapperAgent: React.FC<AppraisalMapperAgentProps> = ({
  onAnalysisComplete,
  agentMode = 'standalone'
}) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [artist, setArtist] = useState('');
  const [event, setEvent] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<SFLAnalysis | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'API Key Required',
        description: 'Please enter your OpenAI API key to proceed',
        variant: 'destructive'
      });
      return;
    }

    if (!artist.trim() || !event.trim()) {
      toast({
        title: 'Missing Information', 
        description: 'Please enter both artist and event details',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      SFLAnalysisService.setApiKey(apiKey);
      
      // Simulate scraping reviews (in real implementation, this would scrape review sites)
      const sampleReview = reviewText || `Saw ${artist} at ${event} - absolutely incredible performance! The energy was off the charts and the crowd was completely mesmerized. Technical skill was outstanding, every note hit perfectly. The lighting and stage setup created such an immersive atmosphere. This was definitely one of those concerts you remember forever. The connection between the artist and audience was palpable throughout the entire show.`;
      
      setProgress(25);
      
      const requestId = `req_${Date.now()}`;
      const sflAnalysis = await SFLAnalysisService.analyzeText(
        sampleReview,
        artist,
        event,
        requestId
      );
      
      setProgress(75);
      
      setAnalysis(sflAnalysis);
      
      // Generate multiagent event
      const multiagentEvent = SFLAnalysisService.generateMultiagentEvent(sflAnalysis, requestId);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(multiagentEvent);
      }
      
      setProgress(100);
      
      toast({
        title: 'Analysis Complete',
        description: 'SFL analysis and meaning mapping completed successfully'
      });
      
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiKey, artist, event, reviewText, toast, onAnalysisComplete]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card className="border-neural-glow/20 bg-gradient-to-br from-background to-background/50 shadow-2xl shadow-neural-glow/10">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="relative">
              <Brain className="w-8 h-8 text-neural-glow" />
              <div className="absolute inset-0 bg-neural-glow blur-md opacity-30" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-neural-glow to-sfl-appraisal bg-clip-text text-transparent">
              AppraisalMapperAgent
            </CardTitle>
          </div>
          <p className="text-muted-foreground text-lg">
            Deep SFL-based analysis of live music reviews • Meaning-driven insights without sentiment bias
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <Badge variant="outline" className="border-sfl-appraisal text-sfl-appraisal">
              <Zap className="w-3 h-3 mr-1" />
              Appraisal Analysis
            </Badge>
            <Badge variant="outline" className="border-sfl-transitivity text-sfl-transitivity">
              <Network className="w-3 h-3 mr-1" />
              Transitivity Mapping
            </Badge>
            <Badge variant="outline" className="border-sfl-meaning text-sfl-meaning">
              <Map className="w-3 h-3 mr-1" />
              Semiotic Torque
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Configuration Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">OpenAI API Key</label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Artist/Band</label>
              <Input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Arctic Monkeys"
                className="bg-background/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Event/Venue</label>
              <Input
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="Madison Square Garden 2024"
                className="bg-background/50 border-border/50"
              />
            </div>
          </div>

          {/* Optional Review Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Review Text (Optional)</label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Enter a specific review to analyze, or leave blank to use sample data..."
              rows={3}
              className="bg-background/50 border-border/50 resize-none"
            />
          </div>

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing SFL Analysis...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-neural-glow hover:bg-neural-glow/90 text-background font-semibold py-3 text-lg shadow-lg shadow-neural-glow/20"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Reviews...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Start SFL Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card className="border-neural-glow/20 bg-gradient-to-br from-background to-background/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Map className="w-6 h-6 text-neural-glow" />
              <span>SFL Analysis Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="appraisal" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-background/50">
                <TabsTrigger value="appraisal" className="data-[state=active]:bg-sfl-appraisal/20">
                  Appraisal
                </TabsTrigger>
                <TabsTrigger value="transitivity" className="data-[state=active]:bg-sfl-transitivity/20">
                  Transitivity
                </TabsTrigger>
                <TabsTrigger value="meaning" className="data-[state=active]:bg-sfl-meaning/20">
                  Meaning Map
                </TabsTrigger>
                <TabsTrigger value="export" className="data-[state=active]:bg-neural-glow/20">
                  Export
                </TabsTrigger>
              </TabsList>

              <TabsContent value="appraisal" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-sfl-appraisal/5 border-sfl-appraisal/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-sfl-appraisal">Attitude Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Affect</span>
                          <span>{(analysis.appraisal.attitude.affect.score * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={analysis.appraisal.attitude.affect.score * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Judgement</span>
                          <span>{(analysis.appraisal.attitude.judgement.score * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={analysis.appraisal.attitude.judgement.score * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Appreciation</span>
                          <span>{(analysis.appraisal.attitude.appreciation.score * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={analysis.appraisal.attitude.appreciation.score * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-sfl-appraisal/5 border-sfl-appraisal/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-sfl-appraisal">Engagement</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Monogloss</span>
                          <span>{(analysis.appraisal.engagement.monogloss * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={analysis.appraisal.engagement.monogloss * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Heterogloss</span>
                          <span>{(analysis.appraisal.engagement.heterogloss * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={analysis.appraisal.engagement.heterogloss * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-sfl-appraisal/5 border-sfl-appraisal/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-sfl-appraisal">Graduation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Force</span>
                          <span>{(analysis.appraisal.graduation.force * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={analysis.appraisal.graduation.force * 100} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Focus</span>
                          <span>{(analysis.appraisal.graduation.focus * 100).toFixed(1)}%</span>
                        </div>
                        <Progress value={analysis.appraisal.graduation.focus * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="transitivity" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-sfl-transitivity/5 border-sfl-transitivity/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-sfl-transitivity">Process Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.transitivity.processes.map((process, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-background/50 rounded">
                            <Badge variant="outline" className="border-sfl-transitivity text-sfl-transitivity">
                              {process.type}
                            </Badge>
                            <span className="text-sm text-muted-foreground truncate ml-2">
                              {process.text.substring(0, 40)}...
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-sfl-transitivity/5 border-sfl-transitivity/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-sfl-transitivity">Participants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysis.transitivity.participants.map((participant, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-background/50 rounded">
                            <Badge variant="outline" className="border-sfl-transitivity text-sfl-transitivity">
                              {participant.role}
                            </Badge>
                            <span className="text-sm text-muted-foreground truncate ml-2">
                              {participant.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="meaning" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="bg-sfl-meaning/5 border-sfl-meaning/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-sfl-meaning">Experiential Meaning</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysis.meaningMap.experiential.map((meaning, idx) => (
                        <div key={idx} className="p-3 bg-background/50 rounded mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{meaning.concept}</span>
                            <Badge variant="outline">{(meaning.strength * 100).toFixed(0)}%</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Connections: {meaning.connections.join(', ')}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-sfl-meaning/5 border-sfl-meaning/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-sfl-meaning">Semiotic Torque</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysis.meaningMap.semioticTorque.map((torque, idx) => (
                        <div key={idx} className="p-3 bg-background/50 rounded mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{torque.pivot}</span>
                            <Badge variant="outline">Depth: {torque.recursionDepth}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Derived: {torque.derivedMeanings.join(', ')}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="export" className="space-y-4 mt-6">
                <Card className="bg-neural-glow/5 border-neural-glow/20">
                  <CardHeader>
                    <CardTitle className="text-lg text-neural-glow">Multiagent Event Export</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-background/50 p-4 rounded-lg text-xs overflow-auto max-h-96 border">
                      {JSON.stringify(SFLAnalysisService.generateMultiagentEvent(analysis, 'export'), null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};