# Tasks - Device Detection & Mic/Camera Usage Tracking

- [x] Modify Backend Database Schema & Mock Data
  - [x] Add `deviceType`, `micOnTime`, `cameraOnTime` to `backend/models/Meeting.js`
  - [x] Add realistic seed values to `backend/memoryStore.js`
- [x] Modify Backend Routing
  - [x] Update `/api/meetings/:id/process` in `backend/routes/meetings.js` to process and save these new fields
- [x] Modify Frontend Active Room & Tracking
  - [x] Track Microphone and Camera active durations inside duration timer interval in `frontend/src/components/MeetingRoom.jsx`
  - [x] Detect device type (`Laptop/Desktop` vs `Phone`) dynamically using userAgent in `frontend/src/components/MeetingRoom.jsx`
  - [x] Send tracking data in the body of the end meeting request
  - [x] Render the device type and camera/mic usage statistics on the AI results summary card in `frontend/src/components/MeetingRoom.jsx`
- [x] Modify Frontend Dashboard View
  - [x] Update meeting card listings in `frontend/src/components/Dashboard.jsx` to render Laptop/Phone metadata icons
- [x] Run & Verify Local Environment
  - [x] Start local backend server on port 5001
  - [x] Start local frontend dev server on port 5173
  - [x] Open `http://localhost:5173` and verify Login using `demo@aimeeting.com` / `demo123`
  - [x] Verify device type icon and mic/camera active tracking stats
