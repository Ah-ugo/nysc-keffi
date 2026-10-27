# Frontend guide

The frontend is a responsive React/TypeScript PWA for Camp Directors, Platoon Officers, and corps members. It calls the FastAPI backend; it does not store member data or biometric photos in browser storage. The signed-in session token is held in `sessionStorage`.

## Start the app

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL if the backend is not at http://localhost:8000.
npm run dev
```

Open the Vite address, normally `http://localhost:5173`. The backend must be running and `VITE_API_URL` must point to it. For a production build use `npm run build`; serve the generated `dist/` directory with SPA fallback. Camera, GPS, and push notifications require HTTPS in production.

## Roles and where to go

### Corps member — `/app`

Sign in with your call-up number and password. The main navigation includes:

- **Home:** camp notices, current bed and platoon summaries, and quick links.
- **My bed:** view and print your assignment slip or download its PDF. Beds are allocated automatically when you are verified and a matching bed is available.
- **Attendance:** submit during an open attendance window. Allow location access and take the requested face photo(s). The app shows whether the result was automatic or needs Director review.
- **My platoon:** view your assigned platoon. If you did not have your state code at registration, enter it here after you receive it. The camp's final-digit mapping assigns your platoon automatically.
- **Exit:** choose an available exit category, duration, dates, and reason; upload requested evidence; then follow the review status shown on the request.
- **Bunk swap:** request a swap with another member or respond to a request. Both members must consent; reserved beds cannot be swapped.
- **Complaints:** send a complaint and follow its response/status.
- **Inbox:** view notifications and announcements, mark notices read, and enable push notifications when configured.

### Camp Director — `/director`

Sign in with the Director username and password configured for the backend. Use:

- **Overview:** key camp counts and charts.
- **Registration QR:** choose an active stream and print/share the registration QR poster. Members can also register at `/register`.
- **Streams:** create streams and change upcoming/active/suspended status. Closing a stream starts a closure review and archives it read-only.
- **Corps members:** review registrations, verify member details, and handle registration exceptions.
- **Hostels & beds:** create male or female hostels and bunk capacity, inspect the bunk map, review automatic allocations, and reassign/release beds. Male members are allocated to male hostels; female members to female hostels.
- **Attendance:** set weekly attendance windows, review uncertain results, inspect evidence, and record an administrative override with a reason when needed.
- **Exits:** configure categories and accepted evidence, review requests/documents, request more information, decide requests, and record actual departures/returns.
- **Platoons:** map state-code final digits 0–9 to Platoons 1–10, view mapping exceptions and rosters, and manage Platoon Officers and ceremonial appointments. Member placement is automatic; there is no assignment confirmation queue.
- **Complaints & notices:** respond to complaints and publish announcements.
- **Reports and settings:** set the camp attendance location/radius and download reports or the audit log.
- **Inbox:** review notifications and enable push if configured.

### Platoon Officer — `/officer`

An Officer account is created and assigned to a platoon by the Camp Director. Sign in using the account credentials provided by the Director. The dashboard shows only that officer's assigned roster and exit requests routed to their platoon. Confirm request details or send the request to the Director with a reason for review. The Officer cannot make final exit decisions or manage other platoons.

## Common workflows

### Register and receive assignments

1. The Director creates a stream and sets it to **Active**.
2. The Director shares the Registration QR, or a member opens the registration link directly.
3. The member enters their details, chooses male/female, takes the requested face photos, consents to processing, and creates a password.
4. The Director verifies the call-up details. When a matching hostel bed is available, the verified member is assigned automatically.
5. The Director configures the platoon state-code mapping. The member may enter the numeric state code during registration or add it later under **My platoon**; a matching code is assigned automatically.

### Handle an exit request

1. The Director configures the category, duration options, evidence rules, and whether Platoon Officer confirmation is required.
2. The member starts the request, uploads required evidence, and submits it.
3. If enabled, the assigned Platoon Officer confirms details. The Director reviews evidence and makes the final decision.
4. The Director records the actual departure. Temporary exits keep the bed reserved; rest-of-camp exits follow the configured release rule.
5. When the member returns, the Director selects **Mark returned**. A reserved bed is restored or an available matching bed is assigned automatically. Recording the return closes the request lock so a later request can be started.

### Review attendance

The member submits a face photo and a one-time location reading while attendance is open. The backend checks the face first and checks the location only if the face result passes. If a provider is unavailable, evidence is inconclusive, or location is outside the configured area, the result goes to Director review. The Director can inspect the submission and, when appropriate, record a reasoned override; the original evidence remains in the record.

## Tips and troubleshooting

- A disabled button usually has a nearby explanation of the missing field or requirement. Exit requests require a valid category, permitted duration, future departure (except the configured urgent medical pathway), a return time after departure for temporary exits, and a reason of at least five characters.
- If the camp stream is suspended or upcoming, member operational actions are unavailable. The Director can activate the stream under **Streams**. A closed stream stays archived and read-only.
- If no bed is assigned, the Director should check that the member is verified, has a valid gender, and that an active hostel of that gender has an available bed.
- If a platoon is not assigned, check that the member has entered their numeric state code and that the last digit has a mapping.
- If camera/GPS prompts do not appear in production, use the app over HTTPS and allow those permissions in the browser.
- If the page cannot reach the backend, check `VITE_API_URL`, backend availability, MongoDB connectivity, and the backend's `CORS_ORIGINS` value.

## Development checks

```bash
npm run build
npm test
```

The frontend uses Vite, React Router, Chakra UI, and a service worker for PWA support. Keep role checks and business rules on the backend; hiding a button in the UI does not replace API authorization.
