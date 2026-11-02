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
import { listDomains } from '@/lib/domainRegistry';
import { SAMPLE_REVIEWS } from '@/lib/sampleReviews';
import { Loader2, Brain, Network, Map, Zap } from 'lucide-react';

interface Props {
  onAnalysisComplete?: (event: MultiagentEvent) => void;
  agentMode?: 'standalone' | 'orchestrated';
}

type Row = { id: string; label: string; stars: number | null; analysis: SFLAnalysis };

const pct = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(1)}%`);
const bar = (v: number | null) => (v === null ? 0 : v * 100);
const DIMS = ['ideational', 'field', 'interpersonal', 'tenor', 'textual', 'mode'] as const;

const Meter = ({ name, v }: { name: string; v: number | null }) => (
  <div>
    <div className="flex justify-between text-sm mb-1"><span>{name}</span><span>{pct(v)}</span></div>
    <Progress value={bar(v)} className="h-2" />
  </div>
);

export const AppraisalMapperAgent: React.FC<Props> = ({ onAnalysisComplete }) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [backend, setBackend] = useState<'openai' | 'huggingface'>('openai');
  const [hfSpace, setHfSpace] = useState('simondrury/sfl-manifold-demo');
  const [hfToken, setHfToken] = useState('');
  const [domain, setDomain] = useState('product_review');
  const [sourceType, setSourceType] = useState('amazon_review');
  const [sourceId, setSourceId] = useState('');
  const [text, setText] = useState(SAMPLE_REVIEWS[1].text);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [analysis, setAnalysis] = useState<SFLAnalysis | null>(null);

  const configure = () => {
    if (backend === 'openai') {
      if (!apiKey.trim()) throw new Error('Enter your OpenAI API key');
      SFLAnalysisService.setApiKey(apiKey);
      SFLAnalysisService.setBackend('openai');
    } else {
      SFLAnalysisService.setHfSpace(hfSpace, hfToken || null);
      SFLAnalysisService.setBackend('huggingface');
    }
  };

  const run = useCallback(async (items: { id: string; label: string; stars: number | null; text: string }[]) => {
    setBusy(true); setProgress(0);
    try {
      configure();
      const out: Row[] = [];
      for (let i = 0; i < items.length; i++) {
        const a = await SFLAnalysisService.analyze(items[i].text, domain, {
          source_type: sourceType, source_id: sourceId || items[i].id,
        });
        out.push({ id: items[i].id, label: items[i].label, stars: items[i].stars, analysis: a });
        setProgress(Math.round(((i + 1) / items.length) * 100));
      }
      setRows(out);
      setAnalysis(out[out.length - 1].analysis);
      onAnalysisComplete?.(SFLAnalysisService.createMultiagentEvent(out[out.length - 1].analysis));
      toast({ title: 'Analysis Complete', description: `${out.length} text(s) analysed via ${backend}` });
    } catch (e) {
      toast({ title: 'Analysis Failed', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    } finally { setBusy(false); }
  }, [apiKey, backend, hfSpace, hfToken, domain, sourceType, sourceId, onAnalysisComplete, toast]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card className="border-neural-glow/20">
        <CardHeader className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <Brain className="w-8 h-8 text-neural-glow" />
            <CardTitle className="text-3xl font-bold">Appraisal Whisperer</CardTitle>
          </div>
          <p className="text-muted-foreground">SFL substrate analysis of any text: ranked on what people said, not on stars</p>
          <div className="flex justify-center gap-3 text-sm">
            <Badge variant="outline"><Zap className="w-3 h-3 mr-1" />Appraisal</Badge>
            <Badge variant="outline"><Network className="w-3 h-3 mr-1" />Transitivity</Badge>
            <Badge variant="outline"><Map className="w-3 h-3 mr-1" />Six-element vector</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Backend</label>
              <select value={backend} onChange={(e) => setBackend(e.target.value as 'openai' | 'huggingface')}
                className="w-full rounded-md border border-border/50 bg-background/50 p-2 text-sm">
                <option value="openai">OpenAI GPT-4</option>
                <option value="huggingface">Hugging Face manifold (experimental)</option>
              </select>
            </div>
            {backend === 'openai' ? (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">OpenAI API Key</label>
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">HF Space (owner/name)</label>
                  <Input value={hfSpace} onChange={(e) => setHfSpace(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">HF token (optional)</label>
                  <Input type="password" value={hfToken} onChange={(e) => setHfToken(e.target.value)} placeholder="hf_..." />
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Domain</label>
              <select value={domain} onChange={(e) => setDomain(e.target.value)}
                className="w-full rounded-md border border-border/50 bg-background/50 p-2 text-sm">
                {listDomains().map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source Type</label>
              <Input value={sourceType} onChange={(e) => setSourceType(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Source ID (ASIN)</label>
              <Input value={sourceId} onChange={(e) => setSourceId(e.target.value)} placeholder="B0XXXXXXXX" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Text to analyse</label>
              <div className="flex gap-2">
                {SAMPLE_REVIEWS.map((s) => (
                  <Button key={s.id} type="button" variant="outline" size="sm" onClick={() => setText(s.text)}>
                    {s.id} · {s.stars}★
                  </Button>
                ))}
              </div>
            </div>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="resize-none" />
            <p className="text-xs text-muted-foreground">Samples A–C are illustrative, synthetic reviews.</p>
          </div>

          {busy && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Processing…</span><span>{progress}%</span></div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button disabled={busy || !text.trim()} onClick={() => run([{ id: 'custom', label: 'Custom text', stars: null, text }])}>
              {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              Analyse text
            </Button>
            <Button variant="secondary" disabled={busy}
              onClick={() => run(SAMPLE_REVIEWS.map((s) => ({ id: s.id, label: s.label, stars: s.stars, text: s.text })))}>
              Compare samples A–C
            </Button>
          </div>
        </CardContent>
      </Card>

      {rows.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Stars vs. what was said</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-3">Review</th><th className="pr-3">Stars</th>
                  <th className="pr-3">Judgement</th><th className="pr-3">Force</th>
                  {DIMS.map((d) => <th key={d} className="pr-3 capitalize">{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-3">{r.id} · {r.label}</td>
                    <td className="pr-3">{r.stars ?? '—'}</td>
                    <td className="pr-3">{pct(r.analysis.appraisal.attitude.judgement)}</td>
                    <td className="pr-3">{pct(r.analysis.appraisal.graduation.force)}</td>
                    {DIMS.map((d) => <td key={d} className="pr-3">{pct(r.analysis.vector[d])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card>
          <CardHeader><CardTitle>Results · backend: {analysis.backend}</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="vector">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="vector">Vector</TabsTrigger>
                <TabsTrigger value="appraisal">Appraisal</TabsTrigger>
                <TabsTrigger value="transitivity">Transitivity</TabsTrigger>
                <TabsTrigger value="meaning">Meaning Map</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="vector" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card><CardHeader><CardTitle className="text-lg">Metafunctions</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <Meter name="Ideational" v={analysis.vector.ideational} />
                      <Meter name="Interpersonal" v={analysis.vector.interpersonal} />
                      <Meter name="Textual" v={analysis.vector.textual} />
                    </CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-lg">Register variables</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <Meter name="Field" v={analysis.vector.field} />
                      <Meter name="Tenor" v={analysis.vector.tenor} />
                      <Meter name="Mode" v={analysis.vector.mode} />
                    </CardContent></Card>
                </div>
              </TabsContent>

              <TabsContent value="appraisal" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card><CardHeader><CardTitle className="text-lg">Attitude</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <Meter name="Affect" v={analysis.appraisal.attitude.affect} />
                      <Meter name="Judgement" v={analysis.appraisal.attitude.judgement} />
                      <Meter name="Appreciation" v={analysis.appraisal.attitude.appreciation} />
                    </CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-lg">Engagement</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <Meter name="Monogloss" v={analysis.appraisal.engagement.monogloss} />
                      <Meter name="Heterogloss" v={analysis.appraisal.engagement.heterogloss} />
                    </CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-lg">Graduation</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <Meter name="Force" v={analysis.appraisal.graduation.force} />
                      <Meter name="Focus" v={analysis.appraisal.graduation.focus} />
                    </CardContent></Card>
                </div>
                {analysis.appraisal.raw_appraisal_tokens.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {analysis.appraisal.raw_appraisal_tokens.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transitivity" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card><CardHeader><CardTitle className="text-lg">Processes</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.transitivity.processes.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-background/50">
                          <Badge variant="outline">{p.type}</Badge>
                          <span className="text-sm text-muted-foreground ml-2 truncate">{p.trigger} · {pct(p.confidence)}</span>
                        </div>))}
                    </CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-lg">Participants</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.transitivity.participants.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-background/50">
                          <Badge variant="outline">{p.role}</Badge>
                          <span className="text-sm text-muted-foreground ml-2 truncate">{p.entity}</span>
                        </div>))}
                    </CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-lg">Circumstances</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {analysis.transitivity.circumstances.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-background/50">
                          <Badge variant="outline">{c.type}</Badge>
                          <span className="text-sm text-muted-foreground ml-2 truncate">{c.expression}</span>
                        </div>))}
                    </CardContent></Card>
                </div>
              </TabsContent>

              <TabsContent value="meaning" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card><CardHeader><CardTitle className="text-lg">Meaning map</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <Meter name="Experiential" v={analysis.meaning_map.experiential} />
                      <Meter name="Interpersonal" v={analysis.meaning_map.interpersonal} />
                      <Meter name="Textual" v={analysis.meaning_map.textual} />
                      <Meter name="Semiotic torque" v={analysis.meaning_map.semiotic_torque} />
                    </CardContent></Card>
                  <Card><CardHeader><CardTitle className="text-lg">Dominant concept</CardTitle></CardHeader>
                    <CardContent>
                      <p className="font-medium">{analysis.meaning_map.dominant_concept ?? '—'}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {analysis.meaning_map.derived_meanings.join(', ') || 'No derived meanings returned'}
                      </p>
                    </CardContent></Card>
                </div>
              </TabsContent>

              <TabsContent value="export" className="mt-6">
                <pre className="bg-background/50 p-4 rounded-lg text-xs overflow-auto max-h-96 border">
                  {JSON.stringify(SFLAnalysisService.createMultiagentEvent(analysis), null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};