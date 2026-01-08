# All Around Australia 🇦🇺

An interactive map visualization tracking my journey around Australia, powered by Strava data and built with modern web technologies.

![Project Screenshot](https://via.placeholder.com/800x450?text=All+Around+Australia+Map+Visualization)

## 🌟 Features

- **Interactive Map**: Built with **Leaflet** and **Esri World Ocean Base** tiles for a stunning visual experience.
- **Journey Tracking**: detailed route visualization with daily segments.
  - **Hover Effects**: Routes glow amber when hovered for clarity.
  - **Smart Interaction**: Clicking a route on the map automatically opens the sidebar and focuses on that specific day's activity.
- **Collapsible Sidebar**: A glassmorphic UI that houses the journey timeline.
  - **Accordion Expansion**: Only one activity is open at a time to keep focus.
  - **Auto-Focus**: The sidebar smooth-scrolls to center the active journey segment.
- **Photo Integration**: Geotagged photos from Strava are displayed on the map with clustered markers and an interactive carousel.
- **Responsive Design**: optimized for desktop and tablet viewing.

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Map Library**: [React Leaflet](https://react-leaflet.js.org/) + [Leaflet](https://leafletjs.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: CSS Modules with a custom dark/glassmorphism design system.
- **Data Source**: Strava API (synced to local JSON via Node.js scripts).

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/all-around-australia.git
    cd all-around-australia
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to `http://localhost:5173`.

## 🔄 Data Synchronization

This project relies on activity data fetched from Strava. The synchronization scripts are located in the `scripts/` directory.

To update the data (requires valid `.env.local` with Strava credentials):

```bash
node scripts/sync-strava.js
```

## 📂 Project Structure

- `src/components`: UI components (MapDisplay, Sidebar, etc.)
- `src/contexts`: Global state management (UIContext)
- `src/data`: Synced JSON data from Strava
- `src/assets`: Static assets like icons and images

## � Deployment

The easiest way to publish this app is using **Vercel** or **Netlify**.

### Data Updates
Since this app uses static JSON data (`src/data/strava-activities.json`) fetched from Strava, **you do not need API keys in your production environment**.

To update your live site with the latest journey data:
1.  Run the sync script locally: `node scripts/sync-strava.js`
2.  Commit the updated JSON file: `git commit -am "Update journey data"`
3.  Push to GitHub: `git push`
4.  Your deployment platform will automatically rebuild and publish the new data.

### Vercel (Recommended)
1.  Push your code to a GitHub repository.
2.  Go to [Vercel](https://vercel.com) and "Add New Project".
3.  Import your repository.
4.  Vercel will detect `Vite` and configure the build settings automatically.
5.  Click **Deploy**.

## �📄 License

This project is for personal use and visualization of private Strava data.

---