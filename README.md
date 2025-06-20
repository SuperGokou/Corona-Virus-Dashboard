# 🦠 Corona Virus Dashboard

An interactive web dashboard that visualises Covid-19 data for all 50 US states.
It combines an animated choropleth map, a sortable data table, two bar charts,
and a time-range brush so users can explore cases and deaths both in absolute
numbers and relative to population.

---


## 💡 Features

| Component | Interaction | Purpose |
|-----------|-------------|---------|
| **Map** (left) | Color scale updates when metric changes; click a state to highlight it everywhere | Spatial distribution of the chosen metric |
| **State table / map carousel** | Carousel switch toggles between table and map | Rank or look up states numerically |
| **Bar chart 1** | Shows top-N states for the current metric | Quick comparison of worst-affected states |
| **Bar chart 2** | Always shows total US numbers for comparison | National context |
| **Category selector** | Four metrics: cases / deaths (absolute / relative) | Explore different aspects of the pandemic |
| **Switch-view button** | Toggles left-hand carousel slides | Table ↔ Map |
| **Time-range brush** | Brushing updates every other view | Focus on any sub-period |

All charts are fully linked: selecting a state or brushing a date range filters
every other component in real time.

---

## 🗂 File structure

		├── index.html # Main page (Bootstrap layout)
		├── css/
		│ └── styles.css # Custom styling (map colours, fonts, etc.)
		├── js/
		│ ├── helpers.js # Utility functions (colour scales, number fmt)
		│ ├── dataTable.js # Reusable table component
		│ ├── mapVis.js # Choropleth map class
		│ ├── barVis.js # Generic bar-chart class
		│ ├── brushVis.js # Timeline brush component
		│ └── main.js # Loads data, instantiates views, coordinates
		├── data/
		│ ├── us-states.topojson # US geometry
		│ └── covid-timeseries.csv # Daily state-level case / death counts
		└── README.md
		

*(Your `data/` folder names may differ – adjust the list if needed.)*

---

## 🔧 Built with

* **D3.js v7** — drawing & interaction
* **TopoJSON** — lightweight state boundaries  
* **Bootstrap 4.6** — responsive grid & components
* **CSV / JSON** — data files loaded at runtime

---

