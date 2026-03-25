# WebsiteOrganiser - MERN Stack Version

A modern, full-stack version of the WebsiteOrganiser project built using the MERN stack (MongoDB, Express, React, Node.js).

## 🚀 Features

- **Full-Stack Architecture**: Custom Node.js/Express backend with MongoDB storage.
- **Modern UI**: Built with React, Tailwind CSS, and Lucide-icons.
- **RESTful API**: Complete set of endpoints for managing groups and keywords.
- **Real-time Updates**: Instant data synchronization between frontend and backend.
- **Responsive Design**: Optimized for all devices.

## 📂 Project Structure

```text
MERN-Project/
├── client/          # React frontend (Vite)
│   ├── src/         # Application logic and components
│   └── public/      # Static assets
└── server/          # Node.js/Express backend
    ├── index.js     # Server entry point and API routes
    └── .env         # Environment variables
```

## ⚙️ Setup & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally.

### 1. Server Setup
```bash
cd server
npm install
# Create a .env file with MONGODB_URI and PORT
npm run dev
```

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```

## 🌐 API Endpoints

- `GET /api/groups`: Fetch all groups.
- `POST /api/groups`: Create a new group.
- `PATCH /api/groups/:id`: Update group details.
- `DELETE /api/groups/:id`: Remove a group.
- `POST /api/groups/:groupId/keywords`: Add a keyword to a group.
- `DELETE /api/groups/:groupId/keywords/:keywordId`: Remove a keyword.

---
*Created as a full-stack evolution of the original WebsiteOrganiser project.*
