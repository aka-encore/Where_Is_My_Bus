# Where Is My Bus

**Where Is My Bus** is a production-quality, real-time campus bus tracking and transport management platform. Built with a full-stack architecture, it provides live GPS tracking, dynamic ETA computation, automated stop arrival/departure notifications, fleet and route management, public tracking links, role-based dashboards, and driver-side trip controls wrapped in a warm luxury glassmorphic interface.

---

## 🎨 Visual Identity & Design System

The application features an executive-level, modern glassmorphic interface built upon a warm luxury palette:

- **Primary Identity / Action Accent:** Deep Burgundy (`#690907`) — primary buttons, active links, important badges, accent highlights
- **Secondary Surfaces & Cards:** Muted Sage Grey (`#A5A79B`) & Soft Sage (`#D8D9D0`) — secondary controls, card borders, subtle tags
- **Backgrounds & Ambient Glow:** Warm Cream Beige (`#E8D2B5`), Light Beige (`#EFE5D8`), & Soft Ivory (`#F5F0E8`) — translucent glass panels, warm ambient backdrops
- **Typography & High Contrast:** Warm Charcoal (`#292522`) — legible, high-contrast headings and body copy

*Design Principles: Refined glassmorphism with backdrop blur, fine borders, soft natural warm shadows, elegant rounded corners, and absolute avoidance of blue/violet tones.*

---

## 🚀 Key Modules & Capabilities

- **Admin Control Suite (`/admin`)**:
  - Live fleet overview on interactive map with real-time bus locations
  - Bus fleet management (fleet addition, seat capacity, status)
  - Driver management and vehicle assignment
  - Interactive route builder & stop sequence editor with drag-and-drop reordering
  - Student assignment to routes and designated pick-up stops
  - Analytics, trip logs, and one-click CSV report export
  - Real-time SOS alerts and emergency response dispatch

- **Driver Interface (`/driver`)**:
  - One-tap trip initiation and termination
  - Continuous background GPS location broadcasting with offline buffer fallback
  - Screen wake-lock to prevent device sleep during active routes
  - Integrated GPS route simulator (`/driver-sim`) for testing without a physical bus
  - Emergency SOS broadcast trigger with breakdown alerts

- **Student & Commuter Dashboard (`/student`)**:
  - Real-time bus live tracking with automated road-snapped polyline and live bus marker
  - Dynamic ETA calculations taking into account route progression and stop sequence
  - Automatic push notifications for approaching buses and stop arrivals
  - Missed-bus alternative route suggestions
  - Independent profile settings for password and contact updates

- **Public Tracking (`/track`, `/track/:busName`)**:
  - Open tracking view allowing parents and students to monitor bus status without logging in

---

## 🔐 Authentication & Role Redirection

Where Is My Bus implements strict role-based navigation:

1. **Admin Login** → Instantly redirects to `/admin` (Admin Dashboard)
2. **Driver Login** → Instantly redirects to `/driver` (Driver Dashboard)
3. **Student Login** → Instantly redirects to `/student` (Student Dashboard)
4. **User Profile** → Accessible independently via explicit navigation to `/profile`

- **Session Persistence**: JWT-authenticated state persisted in secure local storage, re-validated with `/auth/me` on browser refresh.
- **Route Guarding**: Unauthorized role access is blocked and automatically redirected to the user's appropriate dashboard.
- **Logout Handling**: Secure token cleanup and return to login.

---

## 🛠️ Technology Stack

- **Frontend**:
  - React 18, Vite 7, React Router 6
  - Tailwind CSS 3 with custom warm luxury design tokens
  - Leaflet & React-Leaflet with Leaflet.pm vector drawing
  - Socket.IO Client for sub-second bidirectional telemetry
  - Lucide React for consistent icons
  - Framer Motion for subtle micro-interactions
  - React Hot Toast for notification alerts

- **Backend**:
  - Node.js & Express 4
  - Socket.IO for real-time geolocation streaming and room management
  - MongoDB & Mongoose for schema-backed data persistence
  - JSON Web Tokens (JWT) & bcryptjs for authentication
  - Web-Push for web push notifications
  - OSRM (Open Source Routing Machine) integration for road routing and ETAs

---

## 💻 Running Locally

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Required environment variables in `backend/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
DB_NAME=WhereIsMyBus
JWT_SECRET=your_jwt_secret
```

Optional configuration:
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
OSRM_BASE_URL=http://router.project-osrm.org
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:admin@example.com
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend environment variables in `frontend/.env`:
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

---

## 🔑 Default Credentials (Development)

Upon initial server start, a default administrator account is ensured if one does not exist:
- **Username:** `ad1`
- **Password:** `ad1`
- **Role:** Administrator (`admin`)

*(Change default credentials in production settings)*

---

## 📚 Project Documentation

- System Architecture & Endpoints: [`PROJECT_DOCUMENTATION.md`](PROJECT_DOCUMENTATION.md)
- IEEE Reference: [`IEEE.md`](IEEE.md)
- UI Design Specifications: [`ui.md`](ui.md)
- AI & Knowledge Base: [`llm.md`](llm.md)
- Diagram Specifications: [`DIAGRAM_CONTENT.md`](DIAGRAM_CONTENT.md)
