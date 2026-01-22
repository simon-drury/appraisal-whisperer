# Appraisal Whisperer

SFL-based (Systemic Functional Linguistics) analysis system for live music reviews. This application provides deep linguistic analysis of performance reviews, mapping appraisal structures, transitivity patterns, and experiential meaning without sentiment bias.

## Overview

Appraisal Whisperer implements a sophisticated NLP agent (`AppraisalMapperAgent`) that analyzes concert and performance reviews through the lens of Systemic Functional Linguistics. The system goes beyond surface-level sentiment analysis to reveal underlying meaning structures, evaluative patterns, and semantic relationships.

### Core Analysis Features

**Appraisal Analysis**
- Attitude mapping (affect, judgement, appreciation)
- Engagement analysis (monogloss/heterogloss)
- Graduation measurement (force and focus)

**Transitivity Mapping**
- Process type identification (material, mental, relational, verbal, behavioural, existential)
- Participant role analysis
- Circumstance extraction

**Meaning Mapping**
- Experiential meaning network construction
- Semiotic torque detection (meaning drift and recursion)
- Concept strength and connection analysis

**Multiagent Integration**
- Event-based output format for orchestration systems
- Standalone or orchestrated operation modes
- Structured data export for downstream agents

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **NLP**: OpenAI API (GPT-based SFL analysis)
- **State Management**: React hooks

## Project Structure

```
src/
├── components/
│   ├── AppraisalMapperAgent.tsx    # Main analysis agent component
│   └── ui/                         # shadcn/ui components
├── pages/
│   ├── Index.tsx                   # Main application page
│   └── NotFound.tsx
├── services/
│   └── sflAnalysisService.ts       # SFL analysis logic
├── types/
│   └── sfl.ts                      # TypeScript type definitions
└── hooks/
    └── use-toast.ts                # Toast notification hook
```

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or bun
- OpenAI API key

### Setup

```bash
# Clone the repository
git clone https://github.com/simon-drury/appraisal-whisperer.git
cd appraisal-whisperer

# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

1. **Configure API Access**
   - Enter OpenAI API key in the interface
   - API key is used client-side only and not stored

2. **Input Performance Details**
   - Artist/Band name
   - Event/Venue information
   - Optional: Custom review text (or use sample data)

3. **Run Analysis**
   - Click "Start SFL Analysis"
   - System performs multi-stage linguistic analysis
   - Results displayed in interactive tabs

4. **Explore Results**
   - **Appraisal tab**: Attitude, engagement, and graduation metrics
   - **Transitivity tab**: Process types and participant roles
   - **Meaning Map tab**: Experiential meaning and semiotic torque
   - **Export tab**: Multiagent event format (JSON)

## Agent Modes

### Standalone Mode
```tsx
<AppraisalMapperAgent agentMode="standalone" />
```
Operates independently with full UI for direct user interaction.

### Orchestrated Mode
```tsx
<AppraisalMapperAgent 
  agentMode="orchestrated"
  onAnalysisComplete={(event) => routeToNextAgent(event)}
/>
```
Integrates with multiagent systems via callback-based event routing.

## SFL Theory Background

Systemic Functional Linguistics treats language as a meaning-making resource organized into three metafunctions:

- **Interpersonal**: How speakers position themselves and interact (via Appraisal)
- **Ideational**: How experience is represented (via Transitivity)
- **Textual**: How information is structured and flows

This application focuses on interpersonal and ideational analysis to extract deep semantic structures from performance reviews.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Status

- Functional SFL analysis pipeline with OpenAI integration
- Interactive UI for appraisal, transitivity, and meaning exploration
- Multiagent event export capability
- Built with Vite + React + TypeScript + shadcn/ui stack

This repository demonstrates applied computational linguistics suitable for professional NLP portfolio review.

## Future Enhancements

- Direct review scraping from concert platforms
- Batch analysis across multiple reviews
- Comparative analysis across artists/venues
- Enhanced visualizations for meaning networks
- Python backend integration for heavier SFL processing
