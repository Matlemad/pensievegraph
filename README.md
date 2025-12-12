# **Pensieve 3D Map**

Interactive 3D visualization of Pensieve relationships using a force-directed graph.

## **Features**

* **Affiliations View**: Shows `built_on`, `library`, `affiliated`, `contributor` relationships
* **Funding View**: Shows grants with direction and amounts
* **Filters**: Tags (lens), Min CP, search
* **Interactivity**: Orbit controls, zoom, hover tooltips, click for details
* **URL State**: Deep linking through URL parameters
* **Performance**: Optimized for ~400–600 links

## **Technology Stack**

* **Next.js 14** (App Router, TypeScript)
* **react-force-graph-3d** (Three.js)
* **TailwindCSS** for styling
* **pnpm** for dependency management

## **Installation**

```bash
# Install dependencies
pnpm install

# Copy the .env.example file and configure it
cp .env.example .env.local

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in the browser.

## **Configuration**

Create a `.env.local` file with:

* `USE_MOCK=true`: Use mock data from `public/mock.json`. Set to `false` to use the real API.
* `PENSIEVE_API_BASE`: Full URL of the Pensieve API endpoint (`https://pensieve.ecf.network/api/project-relations`)
* `PENSIEVE_API_KEY` or `API_KEY`: Pensieve API key (header `X-API-Key`)
* `CACHE_TTL_SECONDS`: In-memory cache duration (default: 300)

### **Pensieve API**

The application integrates with Pensieve’s `/api/project-relations` endpoint:

* **Endpoint**: `GET /api/project-relations`
* **Authentication**: Header `X-API-Key: <token>`
* **Rate Limit**: 500 requests per IP per 60 seconds
* **Query Parameters**:

  * `projectId`: Specific project ID (optional)
  * `limit`: 1–300, default 20 (pagination)
  * `offset`: ≥ 0, default 0 (pagination)

The application automatically fetches paginated projects to construct the full graph.

## **Project Structure**

```
pensieve-3d-map/
├── app/
│   ├── api/
│   │   └── graph/
│   │       └── route.ts          # API route for the graph
│   ├── map/
│   │   └── page.tsx              # Main page
│   ├── layout.tsx
│   ├── page.tsx                  # Redirect to /map
│   └── globals.css
├── components/
│   ├── Graph3D.tsx               # 3D graph component
│   ├── Controls.tsx              # Controls (mode, filters, search)
│   ├── Sidebar.tsx               # Sidebar with node details
│   └── Legend.tsx                # Legend
├── lib/
│   ├── api.ts                    # API fetch helpers
│   ├── normalize.ts              # Pensieve → Graph3D normalization
│   ├── pensieve.ts               # Pensieve data fetcher (API or mock)
│   └── types.ts                  # TypeScript types
├── public/
│   └── mock.json                 # Mock data
└── package.json
```

## **API**

### **GET `/api/graph`**

Returns the normalized graph in `Graph3D` format.

**Query Parameters:**

* `mode`: `affiliations` | `funding` (default: `affiliations`)
* `lens`: Comma-separated tags (e.g., `public-goods,education`)
* `minCP`: Minimum CP filter (default: 0)
* `limit`: Maximum number of links (default: no limit - displays all relationships)

**Example:**

```
GET /api/graph?mode=funding&minCP=100&lens=public-goods,education
```

## **URL State**

The `/map` page supports URL parameters for deep linking:

* `mode`: `affiliations` | `funding`
* `lens`: Comma-separated tags
* `minCP`: Minimum CP value
* `limit`: Link limit
* `focus`: Node ID to focus on

**Example:**

```
/map?mode=funding&minCP=100&lens=public-goods,education&focus=proj:arweave
```

## **Controls**

* **Mode Toggle**: Switch between Affiliations and Funding
* **Tags Lens**: Filter by tags (OR logic, comma-separated)
* **Min CP Slider**: Filter nodes by minimum CP (0–5000)
* **Search**: Search and focus a node by name
* **Reset Camera**: Reset the graph view

## **Interactions**

* **Hover**: Shows tooltip with label, kind, tags, CP
* **Click**: Selects a node and shows details in the sidebar
* **Orbit**: Drag to rotate the view
* **Zoom**: Scroll to zoom in/out

## **Sidebar**

When a node is selected, the sidebar shows:

* Basic information (name, type, CP, tags, ecosystem)
* Related entities (top 10 by weight in the current mode)
* Actions:

  * Focus Node: Centers the node in the view
  * Isolate Neighborhood: Show only its neighbors
  * Copy Share Link: Copy URL with current state

## **Performance**

* **Cooldown**: 100 ticks to stabilize the graph
* **No Link Limits**: Displays all project relationships without downsampling
* **Cache**: In-memory cache with configurable TTL (default: 300 seconds)
* **API Optimization**: Uses `includeSnapshot=false` for max 300 projects per page

## **Production Build**

```bash
pnpm build
pnpm start
```

## **Notes**

* Node colors are automatically based on `kind` (project/org/person)
* `grant` links have directional arrows
* Node size is proportional to CP
* Link thickness is proportional to weight

## **License**

MIT
