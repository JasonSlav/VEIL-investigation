# VEIL: Cyber Intelligence & Investigation Platform

VEIL is an immersive, dark-themed investigation platform designed to simulate the experience of a digital forensic analyst. Players uncover complex fraud schemes by analyzing evidence, connecting data points on an interactive graph, and consulting a secure intelligence feed.

## 🚀 Key Features

- **Progressive Discovery**: Start with basic facts and unlock deeper evidence files as you successfully connect the dots.
- **Bilingual Interface**: Fully localized experience in both **English** and **Bahasa Indonesia**.
- **Interactive Evidence Board**: Visualize connections between perpetrators, victims, and digital trails using a dynamic SVG graph.
- **Multi-Level Failure Intel**: Incorrect conclusions trigger forensic assistance, adding new nodes and edges to the graph to guide your reasoning.
- **Intelligence Feed (Oracle)**: Request strategic hints when the investigation hits a dead end.
- **Educational Debrief**: Every closed case provides a comprehensive report on scam methods, red flags, and prevention protocols.
- **Persistent Progress**: Investigation states are automatically saved to LocalStorage, allowing you to resume anytime.

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data**: External JSON-driven case architecture for easy extensibility.

## 💻 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/veil-investigation.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📂 Data Architecture
The platform is designed to be data-agnostic. New cases can be added by creating a new JSON file in `public/data/` following the established bilingual structure:
- `isInitial`: Determines starting visibility of a clue.
- `unlocks`: Array of clue IDs revealed after a successful connection.
- `validEdges`: Defines logical relationships between evidence files.
- `failureClues`: 3-tier forensic assistance data.

## 🌐 Deployment
This project is pre-configured for "satset" deployment on **Vercel**. It includes a `vercel.json` file to handle SPA routing and ensure smooth refreshes.

---
*Revealing hidden patterns. Solving digital deception.*
