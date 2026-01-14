# Zenime Memory Optimization and Card System Documentation

This document explains how Zenime optimizes memory when displaying cards, their sizing system, mobile responsiveness, and how to implement the extract logic for a movie site.

## Table of Contents

1. [Memory Optimization Techniques](#memory-optimization-techniques)
2. [Card Sizing System](#card-sizing-system)
3. [Mobile Mode Implementation](#mobile-mode-implementation)
4. [Extract Logic Implementation](#extract-logic-implementation)
5. [Best Practices](#best-practices)

---

## Memory Optimization Techniques

Zenime employs several advanced memory optimization strategies to ensure smooth performance even when displaying hundreds of anime cards.

### 1. React Component Memoization

**Location:** `src/components/categorycard/CategoryCard.jsx`, `src/components/sidecard/Sidecard.jsx`

Components are wrapped with `React.memo()` to prevent unnecessary re-renders:

```jsx
const CategoryCard = React.memo(({ label, data, showViewMore, ... }) => {
  // Component implementation
});
```

**Benefits:**
- Prevents re-renders when parent components update but props remain unchanged
- Reduces memory allocation for component instances
- Improves performance in large lists

### 2. Data Slicing and Limiting

**Location:** `src/components/categorycard/CategoryCard.jsx:29-31`, `src/components/sidecard/Sidecard.jsx:31-35`

Only a subset of data is rendered at once:

```jsx
// CategoryCard - Limit prop usage
if (limit) {
  data = data.slice(0, limit);
}

// Sidecard - Conditional slicing
const displayedData = limit
  ? data.slice(0, limit)
  : showAll
  ? data
  : data.slice(0, 6); // Default: only 6 items
```

**Benefits:**
- Reduces DOM nodes in memory
- Faster initial render
- Lower memory footprint

### 3. Conditional Rendering Based on Viewport

**Location:** `src/components/categorycard/CategoryCard.jsx:38-49`

Cards are split into "first row" and "remaining items" based on screen size:

```jsx
const getItemsToRender = useCallback(() => {
  if (categoryPage) {
    const firstRow =
      window.innerWidth > 758 && data.length > 4 ? data.slice(0, 4) : [];
    const remainingItems =
      window.innerWidth > 758 && data.length > 4
        ? data.slice(4)
        : data.slice(0);
    return { firstRow, remainingItems };
  }
  return { firstRow: [], remainingItems: data.slice(0) };
}, [categoryPage, data]);
```

**Benefits:**
- Different layouts for different screen sizes
- Only renders what's needed for current viewport
- Prevents rendering hidden elements

### 4. Lazy Loading Images

**Location:** `src/components/voiceactorlist/VoiceactorList.jsx:92`

Images use the native `loading="lazy"` attribute:

```jsx
<img
  src={item.character.poster}
  loading="lazy"
  onError={(e) => {
    e.target.src = "https://i.postimg.cc/HnHKvHpz/no-avatar.jpg";
  }}
/>
```

**Benefits:**
- Images load only when needed (near viewport)
- Reduces initial page load memory
- Better performance on slow connections

### 5. LocalStorage Caching

**Location:** `src/utils/getHomeInfo.utils.js:3-58`

API responses are cached in localStorage to avoid redundant requests:

```jsx
const CACHE_KEY = "homeInfoCache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default async function getHomeInfo() {
  const currentTime = Date.now();
  const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY));

  if (cachedData && currentTime - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data; // Return cached data
  }
  
  // Fetch fresh data if cache expired
  const response = await axios.get(`${api_url}`);
  // ... process and cache data
  localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));
  return dataToCache.data;
}
```

**Benefits:**
- Reduces API calls
- Faster page loads
- Lower network memory usage
- Better offline experience

### 6. Conditional Tooltip Rendering

**Location:** `src/components/categorycard/CategoryCard.jsx:188-199`, `src/components/sidecard/Sidecard.jsx:59-74`

Tooltips only render on desktop and only when hovered:

```jsx
{hoveredItem === item.id + index && window.innerWidth > 1024 && (
  <div className={`absolute ${tooltipPosition}...`}>
    <Qtip id={item.id} />
  </div>
)}
```

**Benefits:**
- Tooltips not rendered on mobile (saves memory)
- Only one tooltip in DOM at a time
- Lazy loading of tooltip data

### 7. Hover Timeout Delays

**Location:** `src/components/categorycard/CategoryCard.jsx:76-87`, `src/components/cart/Cart.jsx:22-33`

Delayed hover state updates prevent rapid re-renders:

```jsx
const handleMouseEnter = (item, index) => {
  const timeout = setTimeout(() => {
    setHoveredItem(item.id + index);
    setShowPlay(true);
  }, 400); // 400ms delay
  setHoveredTimeout(timeout);
};

const handleMouseLeave = () => {
  clearTimeout(hoverTimeout);
  setHoveredItem(null);
  setShowPlay(false);
};
```

**Benefits:**
- Prevents tooltip flickering
- Reduces state updates
- Lower memory churn

### 8. useCallback for Memoized Functions

**Location:** `src/components/categorycard/CategoryCard.jsx:38-49`

Functions are memoized to prevent recreation on every render:

```jsx
const getItemsToRender = useCallback(() => {
  // Function implementation
}, [categoryPage, data]);
```

**Benefits:**
- Prevents unnecessary effect triggers
- Stable function references
- Better dependency tracking

### 9. Conditional State Updates

**Location:** `src/components/categorycard/CategoryCard.jsx:56-65`

State updates only occur when data actually changes:

```jsx
setItemsToRender((prev) => {
  if (
    JSON.stringify(prev.firstRow) !== JSON.stringify(newItems.firstRow) ||
    JSON.stringify(prev.remainingItems) !== JSON.stringify(newItems.remainingItems)
  ) {
    return newItems;
  }
  return prev; // No update if unchanged
});
```

**Benefits:**
- Prevents unnecessary re-renders
- Reduces memory allocations
- Better performance

---

## Card Sizing System

Zenime uses a responsive sizing system that adapts to different screen sizes.

### CategoryCard Sizes

**Location:** `src/components/categorycard/CategoryCard.jsx:148, 263`

#### Standard Cards (Remaining Items)
```jsx
className="w-full h-[250px] object-cover 
  max-[1200px]:h-[35vw]    // Tablet: 35% of viewport width
  max-[758px]:h-[45vw]     // Mobile: 45% of viewport width
  max-[478px]:h-[60vw]"    // Small mobile: 60% of viewport width
```

#### First Row Cards (Category Page)
```jsx
className="w-full h-[320px] object-cover 
  max-[1200px]:h-[35vw]
  max-[758px]:h-[45vw]
  max-[478px]:h-[60vw]
  ultra-wide:h-[400px]"    // Ultra-wide screens: 400px
```

### Grid Layout System

**Location:** `src/components/categorycard/CategoryCard.jsx:230`

```jsx
className="grid grid-cols-6 gap-x-3 gap-y-8 
  max-[1400px]:grid-cols-4    // Medium desktop: 4 columns
  max-[758px]:grid-cols-3     // Tablet: 3 columns
  max-[478px]:grid-cols-2"    // Mobile: 2 columns
```

**Breakdown:**
- **Desktop (>1400px):** 6 columns
- **Medium Desktop (758px-1400px):** 4 columns
- **Tablet (478px-758px):** 3 columns
- **Mobile (<478px):** 2 columns

### Sidecard Sizes

**Location:** `src/components/sidecard/Sidecard.jsx:78`

```jsx
className="flex-shrink-0 w-[60px] h-[75px] rounded-md object-cover"
```

- Fixed size: 60px × 75px
- Used in sidebar recommendations
- Compact design for space efficiency

### Cart Component Sizes

**Location:** `src/components/cart/Cart.jsx:52`

```jsx
className="flex-shrink-0 w-[60px] h-[75px] rounded-md object-cover"
```

- Same as Sidecard: 60px × 75px
- Used in horizontal card layouts
- Consistent sizing across components

### Size Calculation Logic

The viewport width (vw) units ensure cards scale proportionally:

- **35vw on tablets:** Cards take 35% of screen width
- **45vw on mobile:** Cards take 45% of screen width
- **60vw on small mobile:** Cards take 60% of screen width

This ensures:
- Cards remain visible and usable
- Proper aspect ratios maintained
- No horizontal scrolling issues

---

## Mobile Mode Implementation

Zenime implements comprehensive mobile responsiveness through breakpoints and conditional rendering.

### Breakpoint System

**Primary Breakpoints:**
- `max-[1200px]`: Tablet and below
- `max-[758px]`: Mobile landscape and below
- `max-[478px]`: Small mobile devices
- `max-[575px]`: Standard mobile
- `max-[320px]`: Very small devices

### Responsive Grid Adjustments

**Location:** `src/components/categorycard/CategoryCard.jsx:230`

```jsx
<div className="grid grid-cols-6 gap-x-3 gap-y-8 
  max-[1400px]:grid-cols-4 
  max-[758px]:grid-cols-3 
  max-[478px]:grid-cols-2">
```

**Mobile Behavior:**
- Reduces columns as screen gets smaller
- Maintains gap spacing
- Prevents horizontal overflow

### Conditional Element Hiding

**Location:** `src/components/categorycard/CategoryCard.jsx:111`

```jsx
className={`grid grid-cols-4 gap-x-3 gap-y-8 
  ${categoryPage && itemsToRender.firstRow.length > 0
    ? "mt-8 max-[758px]:hidden"  // Hide first row on mobile
    : ""}`}
```

**Mobile Optimizations:**
- First row hidden on mobile (<758px)
- Tooltips disabled on mobile (<1024px)
- Description text hidden on small screens
- Navigation breadcrumbs hidden on mobile

### Mobile-Specific Layouts

**Location:** `src/pages/animeInfo/AnimeInfo.jsx:158-164`

```jsx
<div className="relative grid grid-cols-[minmax(0,75%),minmax(0,25%)] 
  max-[1200px]:flex max-[1200px]:flex-col">
```

**Layout Changes:**
- Desktop: 75/25 grid split
- Mobile: Stacked flex column
- Sidebar moves below main content

### Touch-Friendly Sizing

**Location:** `src/components/categorycard/CategoryCard.jsx:157`

```jsx
className="absolute left-2 bottom-3 flex items-center 
  max-[270px]:flex-col max-[270px]:gap-y-[3px]"
```

**Mobile Considerations:**
- Larger touch targets
- Stacked elements on very small screens
- Adjusted spacing for thumb navigation

### Viewport-Based Height Calculations

**Location:** `src/components/categorycard/CategoryCard.jsx:263`

```jsx
className="w-full h-[250px] 
  max-[1200px]:h-[35vw] 
  max-[758px]:h-[45vw] 
  max-[478px]:h-[60vw]"
```

**Mobile Height Strategy:**
- Uses viewport width (vw) for proportional scaling
- Ensures cards fit screen without scrolling
- Maintains aspect ratios

---

## Extract Logic Implementation

The extract logic handles fetching and processing data from external APIs. Here's how to implement it for a movie site.

### API Utility Structure

**Location:** `src/utils/getAnimeInfo.utils.js`, `src/utils/getHomeInfo.utils.js`

### Basic Extract Pattern

```jsx
// src/utils/getMovieInfo.utils.js
import axios from "axios";

export default async function getMovieInfo(id, random = false) {
  const api_url = import.meta.env.VITE_API_URL;
  
  try {
    if (random) {
      // Get random movie ID first
      const randomIdResponse = await axios.get(`${api_url}/random/id`);
      const response = await axios.get(
        `${api_url}/info?id=${randomIdResponse.data.results}`
      );
      return response.data.results;
    } else {
      // Get specific movie by ID
      const response = await axios.get(`${api_url}/info?id=${id}`);
      return response.data.results;
    }
  } catch (error) {
    console.error("Error fetching movie info:", error);
    return error;
  }
}
```

### Cached Extract Pattern

```jsx
// src/utils/getHomeInfo.utils.js (adapted for movies)
import axios from "axios";

const CACHE_KEY = "movieHomeInfoCache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export default async function getMovieHomeInfo() {
  const api_url = import.meta.env.VITE_API_URL;

  // Check cache first
  const currentTime = Date.now();
  const cachedData = JSON.parse(localStorage.getItem(CACHE_KEY));

  if (cachedData && currentTime - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data; // Return cached data
  }

  // Fetch fresh data
  const response = await axios.get(`${api_url}`);
  
  if (!response.data.results || Object.keys(response.data.results).length === 0) {
    return null;
  }

  // Extract and transform data
  const {
    featured,
    trending,
    topRated,
    nowPlaying,
    upcoming,
    genres,
  } = response.data.results;

  // Structure data for caching
  const dataToCache = {
    data: {
      featured,
      trending,
      topRated,
      nowPlaying,
      upcoming,
      genres,
    },
    timestamp: currentTime,
  };

  // Store in cache
  localStorage.setItem(CACHE_KEY, JSON.stringify(dataToCache));

  return dataToCache.data;
}
```

### Stream/Video Extract Pattern

```jsx
// src/utils/getStreamInfo.utils.js (adapted for movies)
import axios from "axios";

export default async function getStreamInfo(movieId, serverName, quality) {
  const api_url = import.meta.env.VITE_API_URL;
  
  try {
    const response = await axios.get(
      `${api_url}/stream?id=${movieId}&server=${serverName}&quality=${quality}`
    );
    return response.data.results;
  } catch (error) {
    console.error("Error fetching stream info:", error);
    return error;
  }
}
```

### Search Extract Pattern

```jsx
// src/utils/getSearch.utils.js (adapted for movies)
import axios from "axios";

export default async function getMovieSearch(query, page = 1) {
  const api_url = import.meta.env.VITE_API_URL;
  
  try {
    const response = await axios.get(
      `${api_url}/search?q=${encodeURIComponent(query)}&page=${page}`
    );
    return response.data.results;
  } catch (error) {
    console.error("Error fetching search results:", error);
    return error;
  }
}
```

### Using Extract Functions in Components

**Location:** `src/pages/animeInfo/AnimeInfo.jsx:92-113`

```jsx
import { useEffect, useState } from "react";
import getMovieInfo from "@/src/utils/getMovieInfo.utils";

function MovieInfo({ random = false }) {
  const { id: paramId } = useParams();
  const id = random ? null : paramId;
  const [movieInfo, setMovieInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id === "404-not-found-page") {
      return null;
    } else {
      const fetchMovieInfo = async () => {
        setLoading(true);
        try {
          const data = await getMovieInfo(id, random);
          setMovieInfo(data.data);
        } catch (err) {
          console.error("Error fetching movie info:", err);
          setError(err);
        } finally {
          setLoading(false);
        }
      };
      fetchMovieInfo();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [id, random]);

  if (loading) return <Loader />;
  if (error) return <Error />;
  if (!movieInfo) return null;

  // Render movie info
}
```

### Environment Configuration

Create a `.env` file:

```env
VITE_API_URL=https://your-movie-api.com/api
```

Access in code:
```jsx
const api_url = import.meta.env.VITE_API_URL;
```

### Error Handling Best Practices

```jsx
export default async function getMovieInfo(id) {
  const api_url = import.meta.env.VITE_API_URL;
  
  try {
    const response = await axios.get(`${api_url}/info?id=${id}`);
    
    // Validate response
    if (!response.data || !response.data.results) {
      throw new Error("Invalid API response");
    }
    
    return response.data.results;
  } catch (error) {
    // Log error for debugging
    console.error("Error fetching movie info:", error);
    
    // Return error object for component handling
    return {
      error: true,
      message: error.message || "Failed to fetch movie info",
      status: error.response?.status || 500
    };
  }
}
```

### Data Transformation Example

```jsx
export default async function getMovieInfo(id) {
  const api_url = import.meta.env.VITE_API_URL;
  
  try {
    const response = await axios.get(`${api_url}/info?id=${id}`);
    const rawData = response.data.results;
    
    // Transform API response to match component expectations
    const transformedData = {
      id: rawData.id,
      title: rawData.title || rawData.name,
      japanese_title: rawData.original_title || rawData.title,
      poster: rawData.poster_path || rawData.poster,
      backdrop: rawData.backdrop_path || rawData.backdrop,
      overview: rawData.overview || rawData.description,
      rating: rawData.vote_average || rawData.rating,
      releaseDate: rawData.release_date || rawData.released,
      genres: rawData.genres?.map(g => g.name) || [],
      runtime: rawData.runtime || rawData.duration,
      // ... more transformations
    };
    
    return { data: transformedData };
  } catch (error) {
    console.error("Error fetching movie info:", error);
    return error;
  }
}
```

---

## Best Practices

### 1. Memory Management

- ✅ Use `React.memo()` for list items
- ✅ Slice data arrays before rendering
- ✅ Implement lazy loading for images
- ✅ Cache API responses in localStorage
- ✅ Clean up event listeners in useEffect cleanup
- ✅ Use `useCallback` for functions passed as props

### 2. Performance Optimization

- ✅ Limit initial render count
- ✅ Use conditional rendering for mobile/desktop
- ✅ Implement hover delays to prevent flickering
- ✅ Debounce resize and scroll handlers
- ✅ Use CSS transforms instead of position changes

### 3. Mobile Optimization

- ✅ Use viewport units (vw, vh) for responsive sizing
- ✅ Hide non-essential elements on mobile
- ✅ Reduce grid columns on smaller screens
- ✅ Increase touch target sizes
- ✅ Test on actual mobile devices

### 4. Extract Logic

- ✅ Always handle errors gracefully
- ✅ Implement caching for frequently accessed data
- ✅ Validate API responses before using
- ✅ Transform data to match component structure
- ✅ Use environment variables for API URLs
- ✅ Implement retry logic for failed requests

### 5. Code Organization

- ✅ Keep extract logic in separate utility files
- ✅ Use consistent naming conventions
- ✅ Document complex transformations
- ✅ Separate concerns (fetching vs. rendering)
- ✅ Reuse extract functions across components

---

## Summary

Zenime's memory optimization strategy combines:

1. **Component-level optimizations:** React.memo, useCallback, conditional rendering
2. **Data-level optimizations:** Slicing, limiting, caching
3. **Rendering optimizations:** Lazy loading, conditional tooltips, hover delays
4. **Responsive design:** Viewport-based sizing, breakpoint system
5. **Extract logic:** Cached API calls, error handling, data transformation

This comprehensive approach ensures smooth performance even with hundreds of cards displayed simultaneously, while maintaining excellent user experience across all device sizes.

