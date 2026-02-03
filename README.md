# Corona Virus Dashboard

An interactive web dashboard for visualizing COVID-19 data across all 50 US states. Users can explore cases and deaths in both absolute numbers and relative to population through multiple coordinated visualizations.

## Features

| Component | Description |
|-----------|-------------|
| Choropleth Map | Color-coded US map showing spatial distribution of selected metric |
| Data Table | Sortable table displaying all states with population and case/death statistics |
| Bar Charts | Top 10 and Bottom 10 states for the current metric |
| Timeline Brush | Interactive date range selector that filters all visualizations |
| Category Selector | Switch between cases/deaths (absolute/relative) |

All visualizations are linked - selecting a state or brushing a date range updates every component in real time.

## Project Structure

```
Corona-Virus-Dashboard/
├── index.html              # Main HTML page (Bootstrap layout)
├── css/
│   └── styles.css          # Custom styling
├── js/
│   ├── helpers.js          # Utility functions and state name converter
│   ├── dataTable.js        # Data table component
│   ├── mapVis.js           # Choropleth map visualization
│   ├── barVis.js           # Bar chart component
│   ├── brushVis.js         # Timeline brush component
│   └── main.js             # Data loading and initialization
├── lib/                    # Third-party libraries (local copies)
│   ├── bootstrap.min.css
│   ├── bootstrap.bundle.min.js
│   ├── d3.v7.min.js
│   └── ...
├── data/
│   ├── covid_data_20.csv       # 2020 COVID-19 daily case/death data
│   ├── census_usa.csv          # US population data by state
│   └── states-albers-10m.json  # US states TopoJSON
└── README.md
```

## Technologies

- **D3.js v7** - Data visualization and DOM manipulation
- **TopoJSON** - Efficient geographic boundaries
- **Bootstrap 4.6** - Responsive layout and UI components

## Usage

1. Open `index.html` via a local server (see below)
2. Use the category dropdown to switch between metrics
3. Brush the timeline to filter by date range
4. Hover over map states or bar chart bars for detailed tooltips
5. Click "switch view" to toggle between map and table views

## Running Locally

Due to browser security restrictions on loading local files, serve the dashboard via HTTP:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# Or use your IDE's built-in server (WebStorm, VS Code Live Server, etc.)
```

Then open `http://localhost:8000` in your browser.

## Data Sources

- COVID-19 data: CDC state-level daily case and death counts
- Population data: US Census Bureau estimates
