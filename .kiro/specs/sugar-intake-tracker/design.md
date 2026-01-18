# Design Document: Sugar Intake Tracker

## Overview

The Sugar Intake Tracker is a full-stack web application consisting of a React frontend and Node.js/Express backend with MongoDB database. The system provides a calendar-based interface for tracking daily sugar consumption with visual feedback through emojis and colors.

**Architecture Pattern:** Client-Server with RESTful API

**Key Design Decisions:**
- **Frontend Framework:** React for component-based UI and state management
- **Backend Framework:** Node.js with Express for lightweight API server
- **Database:** MongoDB for flexible document storage and free-tier availability (MongoDB Atlas)
- **Hosting:** Vercel for frontend (automatic React deployment), Render for backend (free tier with persistent storage)
- **State Management:** React hooks (useState, useEffect) for local state
- **Styling:** CSS modules for component-scoped styling

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Frontend                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │   Calendar   │  │  Daily Prompt│  │   Images   │  │  │
│  │  │  Component   │  │  Component   │  │ Component  │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────┘  │  │
│  │           │                │                 │         │  │
│  │           └────────────────┴─────────────────┘         │  │
│  │                          │                              │  │
│  │                   ┌──────▼──────┐                       │  │
│  │                   │  API Client │                       │  │
│  │                   └──────┬──────┘                       │  │
│  └──────────────────────────┼────────────────────────────┘  │
└─────────────────────────────┼──────────────────────────────┘
                              │ HTTPS/REST
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                    Node.js/Express Backend                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   API Routes                          │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │  │
│  │  │   Entries  │  │   Images   │  │   Health Check │  │  │
│  │  │   Routes   │  │   Routes   │  │     Route      │  │  │
│  │  └─────┬──────┘  └─────┬──────┘  └────────────────┘  │  │
│  └────────┼───────────────┼─────────────────────────────┘  │
│           │               │                                 │
│  ┌────────▼───────────────▼─────────────────────────────┐  │
│  │              Database Service Layer                   │  │
│  │  ┌────────────────┐      ┌────────────────────────┐  │  │
│  │  │ Entry Service  │      │   Image Service        │  │  │
│  │  └────────┬───────┘      └───────────┬────────────┘  │  │
│  └───────────┼──────────────────────────┼───────────────┘  │
└──────────────┼──────────────────────────┼──────────────────┘
               │                          │
┌──────────────▼──────────────────────────▼──────────────────┐
│                      MongoDB Atlas                          │
│  ┌──────────────────┐      ┌──────────────────────────┐    │
│  │  entries         │      │   images                 │    │
│  │  Collection      │      │   Collection             │    │
│  └──────────────────┘      └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Page Load:** Frontend requests current month's entries → Backend queries MongoDB → Returns JSON array → Frontend renders calendar
2. **Daily Prompt:** User answers → Frontend sends POST/PUT request → Backend validates and stores → Returns confirmation → Frontend updates UI
3. **Historical Update:** User clicks past day → Frontend shows update dialog → User submits → Backend updates entry → Frontend refreshes calendar
4. **Month Navigation:** User clicks prev/next → Frontend requests new month's data → Backend queries date range → Returns entries → Frontend renders new calendar

## Components and Interfaces

### Frontend Components

#### 1. App Component
**Responsibility:** Root component managing global state and routing

**State:**
- `currentMonth`: Date object representing displayed month
- `entries`: Array of entry objects for current month
- `images`: Array of image URLs from backend
- `loading`: Boolean for loading state
- `error`: String for error messages

**Methods:**
- `fetchEntries(month)`: Fetches entries for specified month
- `fetchImages()`: Fetches background images
- `handleMonthChange(direction)`: Navigates to previous/next month

#### 2. DailyPrompt Component
**Responsibility:** Displays daily question and handles user response

**Props:**
- `onAnswer(consumed: boolean)`: Callback when user answers
- `todayEntry`: Existing entry for today (if any)

**State:**
- `answered`: Boolean indicating if user answered today

**Methods:**
- `handleYes()`: Records sugar consumed
- `handleNo()`: Records no sugar consumed

#### 3. Calendar Component
**Responsibility:** Renders monthly calendar grid with visual feedback

**Props:**
- `month`: Date object for displayed month
- `entries`: Array of entry objects
- `onDayClick(date)`: Callback when day is clicked

**Methods:**
- `renderDay(date)`: Renders individual day cell with appropriate styling
- `getEntryForDate(date)`: Finds entry for specific date
- `getDayStyle(entry)`: Returns CSS class based on entry status

#### 4. DayCell Component
**Responsibility:** Renders individual calendar day with visual feedback

**Props:**
- `date`: Date object
- `entry`: Entry object (if exists)
- `onClick`: Callback function
- `isToday`: Boolean

**Visual States:**
- No entry: Neutral gray background
- Sugar consumed: Sad emoji (😔) with light red tint
- No sugar: Happy emoji (😊) with green background

#### 5. UpdateDialog Component
**Responsibility:** Modal for updating past entries

**Props:**
- `date`: Date to update
- `currentEntry`: Existing entry (if any)
- `onUpdate(consumed: boolean)`: Callback with new status
- `onClose()`: Callback to close dialog

#### 6. ImageDisplay Component
**Responsibility:** Displays background/side images

**Props:**
- `images`: Array of image URLs

**Methods:**
- `selectRandomImage()`: Chooses random image for display

### Backend API Endpoints

#### 1. GET /api/entries
**Purpose:** Retrieve entries for a date range

**Query Parameters:**
- `startDate`: ISO 8601 date string
- `endDate`: ISO 8601 date string

**Response:**
```json
{
  "success": true,
  "entries": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "date": "2025-01-15",
      "sugarConsumed": false,
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

#### 2. POST /api/entries
**Purpose:** Create new entry

**Request Body:**
```json
{
  "date": "2025-01-15",
  "sugarConsumed": true
}
```

**Response:**
```json
{
  "success": true,
  "entry": {
    "_id": "507f1f77bcf86cd799439011",
    "date": "2025-01-15",
    "sugarConsumed": true,
    "createdAt": "2025-01-15T10:30:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
}
```

#### 3. PUT /api/entries/:date
**Purpose:** Update existing entry (or create if doesn't exist)

**URL Parameter:**
- `date`: ISO 8601 date string (YYYY-MM-DD)

**Request Body:**
```json
{
  "sugarConsumed": false
}
```

**Response:** Same as POST

#### 4. GET /api/images
**Purpose:** Retrieve list of available images

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "url": "https://example.com/image1.jpg",
      "alt": "Healthy food"
    }
  ]
}
```

#### 5. GET /api/health
**Purpose:** Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### API Client Service (Frontend)

```javascript
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async getEntries(startDate, endDate) {
    // Fetches entries for date range
  }

  async createEntry(date, sugarConsumed) {
    // Creates new entry
  }

  async updateEntry(date, sugarConsumed) {
    // Updates existing entry
  }

  async getImages() {
    // Fetches image list
  }

  async healthCheck() {
    // Checks backend health
  }
}
```

## Data Models

### Entry Model (MongoDB)

```javascript
{
  _id: ObjectId,           // MongoDB generated ID
  date: String,            // ISO 8601 date (YYYY-MM-DD)
  sugarConsumed: Boolean,  // true = consumed, false = not consumed
  createdAt: Date,         // Timestamp of creation
  updatedAt: Date          // Timestamp of last update
}
```

**Indexes:**
- `date`: Unique index for fast lookups and enforcing one entry per day

**Validation Rules:**
- `date`: Required, must match YYYY-MM-DD format
- `sugarConsumed`: Required, must be boolean
- `date` must be unique (enforced by unique index)

### Image Model (MongoDB)

```javascript
{
  _id: ObjectId,      // MongoDB generated ID
  url: String,        // Image URL or base64 data
  alt: String,        // Alt text for accessibility
  createdAt: Date     // Timestamp of creation
}
```

**Validation Rules:**
- `url`: Required, must be valid URL or base64 string
- `alt`: Required, non-empty string

### Frontend State Models

```typescript
interface Entry {
  _id: string;
  date: string;          // YYYY-MM-DD
  sugarConsumed: boolean;
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
}

interface Image {
  _id: string;
  url: string;
  alt: string;
}

interface CalendarDay {
  date: Date;
  entry?: Entry;
  isToday: boolean;
  isCurrentMonth: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Entry Creation and Storage
*For any* valid date and sugar status (boolean), when a Daily_Entry is created, the entry should be stored in the database with the correct date and sugarConsumed values.

**Validates: Requirements 1.2, 4.1**

### Property 2: Entry Update Overwrites Previous Value
*For any* date that already has an entry, when the user updates the sugar status, the system should replace the previous entry with the new status, maintaining only one entry for that date.

**Validates: Requirements 1.3**

### Property 3: One Entry Per Date Constraint
*For any* date, attempting to create multiple entries should result in only one entry existing in the database for that date.

**Validates: Requirements 1.5**

### Property 4: Calendar Displays Correct Day Count
*For any* month and year, the calendar should render exactly the number of days that exist in that month (accounting for leap years).

**Validates: Requirements 2.1**

### Property 5: Visual Feedback Matches Entry Status
*For any* calendar day with an entry, the rendered day cell should display:
- Green background or happy emoji when sugarConsumed is false
- Sad emoji when sugarConsumed is true
- Neutral styling when no entry exists

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 6: Historical Data Navigation
*For any* month with stored entries, when the user navigates to that month, all entries for that month should be displayed in the calendar.

**Validates: Requirements 3.2**

### Property 7: Day Click Triggers Update Dialog
*For any* clickable day in the calendar (past or present), clicking that day should trigger the update dialog with the correct date.

**Validates: Requirements 3.1**

### Property 8: Images Retrieved from Backend
*For any* set of images stored in the backend, the frontend should retrieve and display those images.

**Validates: Requirements 5.1**

### Property 9: Responsive Layout Adaptation
*For any* viewport width from 320px to 1920px, the calendar layout should remain functional and usable without horizontal scrolling.

**Validates: Requirements 5.3**

### Property 10: Touch Events Trigger Same Behavior
*For any* calendar day, touch events should trigger the same update dialog as click events.

**Validates: Requirements 6.2**

### Property 11: API Returns Valid JSON
*For any* successful API request for entries, the backend should return a valid JSON response with the expected structure (success field and entries array).

**Validates: Requirements 8.1**

### Property 12: Invalid Data Rejected with Error
*For any* invalid entry data (missing fields, wrong types, invalid date format), the backend should reject the request and return an error response with a descriptive message.

**Validates: Requirements 8.2, 8.3, 9.3, 9.4**

### Property 13: Successful Operations Return Confirmation
*For any* successful create or update operation, the backend should return a success response containing the created/updated entry.

**Validates: Requirements 8.4**

### Property 14: Entry Contains Required Fields
*For any* entry stored in the database, it should contain all required fields: date (string), sugarConsumed (boolean), createdAt (Date), and updatedAt (Date).

**Validates: Requirements 9.1**

### Property 15: Date Format Validation (Round Trip)
*For any* valid ISO 8601 date string (YYYY-MM-DD), storing an entry with that date and then retrieving it should return the same date string.

**Validates: Requirements 9.3**

## Error Handling

### Frontend Error Handling

**Network Errors:**
- Display user-friendly error message when backend is unreachable
- Show retry button for failed requests
- Maintain UI state during errors (don't lose user input)

**Validation Errors:**
- Display inline validation messages for invalid inputs
- Prevent submission of invalid data
- Highlight fields with errors

**Loading States:**
- Show loading spinner during API requests
- Disable interactive elements during submission
- Provide feedback for long-running operations

### Backend Error Handling

**Request Validation:**
```javascript
// Validate entry data
function validateEntry(data) {
  const errors = [];
  
  if (!data.date) {
    errors.push('Date is required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('Date must be in YYYY-MM-DD format');
  }
  
  if (typeof data.sugarConsumed !== 'boolean') {
    errors.push('sugarConsumed must be a boolean');
  }
  
  return errors;
}
```

**Database Errors:**
- Catch and log database connection errors
- Return 500 status with generic error message (don't expose internals)
- Implement retry logic for transient failures

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      "Date must be in YYYY-MM-DD format"
    ]
  }
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests as complementary approaches:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs using randomized test data

Both are necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection:**
- **Frontend (React/JavaScript):** fast-check library for property-based testing
- **Backend (Node.js):** fast-check library for property-based testing

**Test Configuration:**
- Each property test must run minimum 100 iterations
- Each test must be tagged with a comment referencing the design property
- Tag format: `// Feature: sugar-intake-tracker, Property {number}: {property_text}`

**Example Property Test:**
```javascript
// Feature: sugar-intake-tracker, Property 3: One Entry Per Date Constraint
test('only one entry exists per date', () => {
  fc.assert(
    fc.property(
      fc.date(), // Generate random dates
      fc.boolean(), // Generate random sugar status
      async (date, sugarConsumed) => {
        const dateStr = date.toISOString().split('T')[0];
        
        // Create first entry
        await createEntry(dateStr, sugarConsumed);
        
        // Attempt to create second entry
        await createEntry(dateStr, !sugarConsumed);
        
        // Verify only one entry exists
        const entries = await getEntriesForDate(dateStr);
        expect(entries).toHaveLength(1);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Strategy

**Frontend Unit Tests:**
- Component rendering tests (React Testing Library)
- User interaction tests (click, input, navigation)
- State management tests
- API client tests (mocked responses)
- Edge cases: empty states, error states, loading states

**Backend Unit Tests:**
- API endpoint tests (request/response validation)
- Database service tests (CRUD operations)
- Validation logic tests
- Error handling tests
- Edge cases: invalid inputs, missing fields, malformed data

**Integration Tests:**
- End-to-end user flows (create entry → view calendar → update entry)
- Frontend-backend communication
- Database persistence verification
- Image loading and display

### Test Coverage Goals

- **Unit test coverage:** Minimum 80% code coverage
- **Property test coverage:** All 15 correctness properties implemented
- **Integration test coverage:** All critical user flows tested
- **Edge case coverage:** All identified edge cases tested

### Testing Tools

**Frontend:**
- Jest: Test runner
- React Testing Library: Component testing
- fast-check: Property-based testing
- MSW (Mock Service Worker): API mocking

**Backend:**
- Jest: Test runner
- Supertest: HTTP assertion library
- fast-check: Property-based testing
- mongodb-memory-server: In-memory MongoDB for tests

## Deployment Architecture

### Frontend Deployment (Vercel)

**Build Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "react"
}
```

**Environment Variables:**
- `REACT_APP_API_URL`: Backend API URL (e.g., https://api.example.com)

**Deployment Steps:**
1. Connect GitHub repository to Vercel
2. Configure build settings
3. Set environment variables
4. Deploy (automatic on git push)

### Backend Deployment (Render)

**Service Configuration:**
- **Type:** Web Service
- **Environment:** Node
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Environment Variables:**
- `MONGODB_URI`: MongoDB Atlas connection string
- `PORT`: Port number (provided by Render)
- `NODE_ENV`: production

**Deployment Steps:**
1. Create Render account
2. Connect GitHub repository
3. Configure service settings
4. Set environment variables
5. Deploy

### Database Setup (MongoDB Atlas)

**Configuration:**
- **Tier:** Free (M0)
- **Region:** Closest to backend hosting
- **Network Access:** Allow access from anywhere (0.0.0.0/0) for free tier

**Setup Steps:**
1. Create MongoDB Atlas account
2. Create free cluster
3. Create database user
4. Get connection string
5. Add to backend environment variables

### Monitoring and Maintenance

**Health Checks:**
- Backend health endpoint: `/api/health`
- Frontend monitoring: Vercel analytics
- Database monitoring: MongoDB Atlas dashboard

**Logging:**
- Backend: Console logs (captured by Render)
- Frontend: Browser console + error tracking
- Database: MongoDB Atlas logs

**Backup Strategy:**
- MongoDB Atlas automatic backups (free tier: limited)
- Export data periodically via API
- Store exports in separate location

## Security Considerations

**Data Protection:**
- HTTPS enforced on all connections
- CORS configured to allow only frontend domain
- Input validation on all API endpoints
- SQL injection prevention (using MongoDB parameterized queries)

**Rate Limiting:**
- Implement basic rate limiting on API endpoints
- Prevent abuse of free-tier resources

**Error Messages:**
- Don't expose internal system details in error messages
- Log detailed errors server-side only
- Return generic error messages to clients

## Performance Optimization

**Frontend:**
- Lazy load images
- Memoize expensive calculations (React.memo, useMemo)
- Debounce API calls
- Cache API responses (short TTL)

**Backend:**
- Index database queries (date field)
- Compress API responses (gzip)
- Implement caching for image URLs
- Connection pooling for database

**Database:**
- Create index on date field for fast lookups
- Limit query results to necessary fields only
- Use projection to reduce data transfer

## Future Enhancements

**Potential Features (Not in Current Scope):**
- User authentication and multi-user support
- Notes field for each entry
- Statistics and charts (weekly/monthly summaries)
- Export data to CSV/PDF
- Reminders and notifications
- Dark mode
- Customizable emojis and colors
- Streak tracking
- Goal setting

**Technical Improvements:**
- Offline support (PWA with service workers)
- Real-time sync across devices (WebSockets)
- Advanced caching strategies
- Performance monitoring and analytics
- Automated testing in CI/CD pipeline
