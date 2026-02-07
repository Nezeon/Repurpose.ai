# Drug Repurposing Platform - Frontend

Modern React application for the Repurpose.AI drug repurposing discovery platform.

## Overview

A sleek, dark-themed interface for exploring drug repurposing opportunities featuring:

- **Real-time search** with WebSocket progress updates
- **Multi-dimensional scoring** visualization (Scientific, Market, Competitive, Feasibility)
- **Interactive results dashboard** with evidence breakdown
- **AI-powered insights** and recommendations
- **Responsive design** with mobile navigation
- **Integrations management** for data source configuration

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| Zustand | State management |
| React Router 6 | Routing |
| Framer Motion | Animations |
| Recharts | Data visualizations |
| Lucide React | Icons |
| Axios | HTTP client |

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

1. **Install dependencies:**

```bash
cd frontend
npm install
```

2. **Configure environment:**

```bash
# The API URL is configured in src/config/api.js
# Default: http://localhost:8000
```

3. **Run development server:**

```bash
npm run dev
```

4. **Access the application:**

- Development: http://localhost:5173
- API must be running at http://localhost:8000

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/           # Reusable UI components
│   │   │   ├── Badge.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── SearchInput.jsx
│   │   │   └── Spinner.jsx
│   │   ├── dashboard/        # Dashboard components
│   │   ├── layout/           # Layout components
│   │   │   ├── Header.jsx    # Top navigation
│   │   │   ├── Sidebar.jsx   # Side navigation
│   │   │   ├── MobileNav.jsx # Mobile bottom nav
│   │   │   └── index.js
│   │   ├── results/          # Search results
│   │   │   ├── AIInsights.jsx
│   │   │   ├── EvidencePanel.jsx
│   │   │   ├── OpportunityCard.jsx
│   │   │   ├── OpportunityList.jsx
│   │   │   ├── ResultsHeader.jsx
│   │   │   └── index.js
│   │   ├── scoring/          # Scoring visualizations
│   │   ├── search/           # Search components
│   │   │   ├── AgentStatus.jsx
│   │   │   ├── SearchBox.jsx
│   │   │   ├── SearchProgress.jsx
│   │   │   ├── SearchSuggestions.jsx
│   │   │   └── index.js
│   │   └── visualizations/   # Charts & graphs
│   │       ├── RadarChart.jsx
│   │       ├── SourceDistribution.jsx
│   │       └── index.js
│   ├── config/
│   │   ├── api.js            # API configuration
│   │   └── supabase.js       # Supabase config
│   ├── hooks/
│   │   └── useSearch.js      # Search hook with WebSocket
│   ├── pages/
│   │   ├── Dashboard.jsx     # Home dashboard
│   │   ├── Search.jsx        # Search page
│   │   ├── Results.jsx       # Results page
│   │   ├── History.jsx       # Search history
│   │   ├── Settings.jsx      # User settings
│   │   └── Integrations.jsx  # Data source config
│   ├── services/
│   │   ├── api.js            # API service
│   │   └── auth.js           # Auth service
│   ├── store/
│   │   └── index.js          # Zustand store
│   ├── utils/
│   │   ├── constants.js      # App constants
│   │   ├── formatters.js     # Data formatters
│   │   └── helpers.js        # Utility functions
│   ├── App.jsx               # Root component
│   ├── index.css             # Global styles
│   └── main.jsx              # Entry point
├── public/                   # Static assets
├── index.html                # HTML template
├── tailwind.config.js        # Tailwind configuration
├── vite.config.js            # Vite configuration
└── package.json
```

## Key Features

### 1. Search with Real-time Progress

The search page shows live agent progress via WebSocket:

```jsx
// Real-time updates for 15 agents
const agentProgress = {
  LiteratureAgent: "running",
  ClinicalTrialsAgent: "pending",
  BioactivityAgent: "success",
  // ... 12 more agents
};
```

### 2. Composite Score Visualization

Results display 4-dimensional scores:

| Dimension | Description | Color |
|-----------|-------------|-------|
| Scientific Evidence | Research quality | Blue |
| Market Opportunity | Commercial potential | Green |
| Competitive Landscape | Competition level | Orange |
| Development Feasibility | Path to approval | Purple |

### 3. Evidence Panel

Expandable evidence items showing:
- Source (PubMed, ClinicalTrials, ChEMBL, etc.)
- Quality score
- Publication date
- Direct links to sources

### 4. AI Insights

LLM-generated analysis including:
- Key strengths
- Potential risks
- Strategic recommendations

### 5. Search History

Track previous searches with:
- Drug name and timestamp
- Opportunity count
- Quick navigation to results
- Individual delete functionality
- Clear all option

### 6. Integrations Management

Configure data sources:
- View all available integrations
- Enable/disable specific sources
- Configure API keys for premium sources
- View rate limits and status

## State Management

The app uses Zustand for state:

```javascript
// Store structure
{
  user: null,
  searchHistory: [],
  currentSearch: null,
  agentProgress: {},
  sidebarCollapsed: false,

  // Actions
  setUser: (user) => {...},
  addToHistory: (search) => {...},
  deleteFromHistory: (drugName, timestamp) => {...},
  clearHistory: () => {...},
  setAgentProgress: (progress) => {...},
  toggleSidebar: () => {...},
}
```

## API Integration

### Search Endpoint

```javascript
// POST /api/search
const response = await api.post('/search', {
  drug_name: 'Metformin',
  force_refresh: false
});
```

### WebSocket Connection

```javascript
// Connect to real-time progress
const ws = new WebSocket(`ws://localhost:8000/ws/${sessionId}`);
ws.onmessage = (event) => {
  const { agent, status } = JSON.parse(event.data);
  updateAgentProgress(agent, status);
};
```

### Clear Cache

```javascript
// POST /api/search/cache/clear
await clearCache();
```

## Styling

### Color Palette

```css
:root {
  --brand-darker: #0a0a0a;
  --brand-dark: #121212;
  --brand-slate: #1e1e1e;
  --brand-border: #2a2a2a;
  --brand-yellow: #ffd700;
  --text-primary: #ffffff;
  --text-secondary: #a0a0a0;
  --text-muted: #666666;
  --success: #22c55e;
  --error: #ef4444;
  --warning: #f59e0b;
}
```

### Tailwind Extensions

Custom classes defined in `tailwind.config.js`:
- `bg-brand-*` - Brand background colors
- `text-text-*` - Text color variants
- `border-brand-border` - Border colors

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | Run ESLint |

### Adding New Pages

1. Create page component in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation item in `Sidebar.jsx` and `MobileNav.jsx`
4. Update `ROUTES` constant in `utils/constants.js`

### Adding New Components

1. Create component in appropriate `src/components/` subfolder
2. Export from folder's `index.js` if applicable
3. Use existing common components (Card, Button, Badge, etc.)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### API Connection Issues

```bash
# Ensure backend is running
cd ../backend
uvicorn app.main:app --reload

# Check CORS configuration in backend
# Default allows localhost:5173
```

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

### WebSocket Not Connecting

- Verify backend is running on port 8000
- Check browser console for connection errors
- Ensure no proxy is blocking WebSocket

## License

This project is part of a hackathon submission.

## Contributing

Contributions welcome! Please follow the existing code style and component patterns.
