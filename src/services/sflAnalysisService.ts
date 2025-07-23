import { SFLAnalysis, AppraisalAnalysis, TransitivityAnalysis, MeaningMap, MultiagentEvent, ProcessType, ParticipantRole } from '@/types/sfl';

export class SFLAnalysisService {
  private static apiKey: string | null = null;

  static setApiKey(key: string) {
    this.apiKey = key;
  }

  static async analyzeText(
    text: string, 
    artist: string, 
    event: string,
    requestId: string
  ): Promise<SFLAnalysis> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const analysis: SFLAnalysis = {
      id: `sfl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      text,
      appraisal: await this.performAppraisalAnalysis(text),
      transitivity: await this.performTransitivityAnalysis(text),
      meaningMap: await this.generateMeaningMap(text),
      metadata: {
        source: 'live_review',
        artist,
        event,
        reviewLength: text.length,
        confidenceScore: 0.85,
        processingTime: Date.now()
      }
    };

    return analysis;
  }

  private static async performAppraisalAnalysis(text: string): Promise<AppraisalAnalysis> {
    // Simulate Claude/OpenAI API call for appraisal analysis
    const prompt = `
    Perform Systemic Functional Linguistics Appraisal analysis on this text.
    Analyze for:
    1. ATTITUDE (affect, judgement, appreciation)
    2. ENGAGEMENT (monogloss vs heterogloss)
    3. GRADUATION (force and focus)
    
    Text: "${text}"
    
    Return structured analysis focusing on experiential meaning without sentiment bias.
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in Systemic Functional Linguistics performing appraisal analysis. Focus on meaning structures, not sentiment.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();
      
      // Parse structured response (simplified for demo)
      return this.parseAppraisalResponse(data.choices[0].message.content, text);
    } catch (error) {
      console.error('Appraisal analysis failed:', error);
      return this.getFallbackAppraisal(text);
    }
  }

  private static parseAppraisalResponse(response: string, text: string): AppraisalAnalysis {
    // Parse AI response into structured appraisal data
    // This would be more sophisticated in production
    const words = text.toLowerCase().split(' ');
    
    const affectIndicators = words.filter(w => 
      ['amazing', 'terrible', 'love', 'hate', 'excited', 'disappointed'].includes(w)
    );
    
    const judgementIndicators = words.filter(w => 
      ['skilled', 'talented', 'awful', 'professional', 'amateur'].includes(w)
    );
    
    const appreciationIndicators = words.filter(w => 
      ['beautiful', 'ugly', 'brilliant', 'boring', 'incredible'].includes(w)
    );

    return {
      attitude: {
        affect: {
          score: Math.min(affectIndicators.length * 0.3, 1),
          indicators: affectIndicators,
          strength: affectIndicators.length > 2 ? 'high' : affectIndicators.length > 0 ? 'medium' : 'low'
        },
        judgement: {
          score: Math.min(judgementIndicators.length * 0.25, 1),
          indicators: judgementIndicators,
          strength: judgementIndicators.length > 2 ? 'high' : judgementIndicators.length > 0 ? 'medium' : 'low'
        },
        appreciation: {
          score: Math.min(appreciationIndicators.length * 0.35, 1),
          indicators: appreciationIndicators,
          strength: appreciationIndicators.length > 2 ? 'high' : appreciationIndicators.length > 0 ? 'medium' : 'low'
        }
      },
      engagement: {
        monogloss: 0.6,
        heterogloss: 0.4
      },
      graduation: {
        force: 0.7,
        focus: 0.5
      },
      polarity: 'neutral',
      intensity: 0.6
    };
  }

  private static async performTransitivityAnalysis(text: string): Promise<TransitivityAnalysis> {
    // Simulate transitivity analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    
    const processes = sentences.map((sentence, i) => ({
      type: this.identifyProcessType(sentence),
      text: sentence.trim(),
      intensity: Math.random() * 0.5 + 0.5,
      position: [i * 100, Math.random() * 200] as [number, number]
    }));

    const participants = sentences.map((sentence, i) => ({
      role: this.identifyParticipantRole(sentence),
      text: sentence.split(' ').slice(0, 3).join(' '),
      agency: Math.random() * 0.5 + 0.5,
      position: [i * 120 + 50, Math.random() * 180 + 20] as [number, number]
    }));

    return {
      processes,
      participants,
      circumstances: [],
      clauseComplexity: sentences.length / text.split(' ').length,
      dominantProcessType: 'mental'
    };
  }

  private static identifyProcessType(sentence: string): ProcessType {
    const lowerSentence = sentence.toLowerCase();
    if (lowerSentence.includes('feel') || lowerSentence.includes('think')) return 'mental';
    if (lowerSentence.includes('play') || lowerSentence.includes('perform')) return 'material';
    if (lowerSentence.includes('said') || lowerSentence.includes('told')) return 'verbal';
    if (lowerSentence.includes('is') || lowerSentence.includes('was')) return 'relational';
    return 'material';
  }

  private static identifyParticipantRole(sentence: string): ParticipantRole {
    const lowerSentence = sentence.toLowerCase();
    if (lowerSentence.includes('artist') || lowerSentence.includes('band')) return 'actor';
    if (lowerSentence.includes('audience') || lowerSentence.includes('crowd')) return 'senser';
    return 'actor';
  }

  private static async generateMeaningMap(text: string): Promise<MeaningMap> {
    // Generate meaning map with semiotic torque analysis
    return {
      experiential: [
        {
          concept: 'musical_performance',
          strength: 0.8,
          connections: ['artist_skill', 'audience_response'],
          evidence: ['performance indicators in text']
        }
      ],
      interpersonal: [
        {
          stance: 'evaluative',
          modality: 0.7,
          engagement: 0.6,
          evidence: ['modal expressions']
        }
      ],
      textual: [
        {
          theme: 'concert_experience',
          coherence: 0.75,
          flow: ['intro', 'description', 'evaluation']
        }
      ],
      semioticTorque: [
        {
          pivot: 'performance_quality',
          recursionDepth: 2,
          pivotStrength: 0.85,
          derivedMeanings: ['technical_skill', 'emotional_impact']
        }
      ]
    };
  }

  private static getFallbackAppraisal(text: string): AppraisalAnalysis {
    return {
      attitude: {
        affect: { score: 0.5, indicators: [], strength: 'medium' },
        judgement: { score: 0.5, indicators: [], strength: 'medium' },
        appreciation: { score: 0.5, indicators: [], strength: 'medium' }
      },
      engagement: { monogloss: 0.5, heterogloss: 0.5 },
      graduation: { force: 0.5, focus: 0.5 },
      polarity: 'neutral',
      intensity: 0.5
    };
  }

  static generateMultiagentEvent(analysis: SFLAnalysis, requestId: string): MultiagentEvent {
    return {
      eventType: 'SFL_ANALYSIS_COMPLETE',
      agentId: 'AppraisalMapperAgent',
      timestamp: new Date().toISOString(),
      data: analysis,
      metadata: {
        conversationId: `conv_${Date.now()}`,
        requestId
      }
    };
  }
}