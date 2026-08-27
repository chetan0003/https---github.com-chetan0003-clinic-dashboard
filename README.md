# ClinicFlow React

React/Vite conversion of the uploaded ClinicFlow dashboard UI, with login and clinic-user signup integrated with the supplied Spring Boot APIs.

## APIs

Login:
POST `http://localhost:8080/api/auth/login`

Body:
```json
{
  "username": "reception1",
  "password": "Staff@123"
}
```

Signup:
POST `http://localhost:8080/api/clinic-admin/users`

Headers:
```text
Authorization: Bearer <login-token>
Content-Type: application/json
```

Body:
```json
{
  "username": "reception1",
  "email": "reception@clinic.com",
  "password": "Staff@123",
  "firstName": "Reception",
  "lastName": "Staff",
  "phone": "+919876543210",
  "role": "STAFF",
  "clinicId": 1,
  "doctorId": null
}
```

## Run

1. Install Node.js 18+.
2. Copy `.env.example` to `.env`.
3. Keep:
   `VITE_API_BASE_URL=http://localhost:8080`
4. Run:
   `npm install`
   `npm run dev`

## Authentication behavior

- Login calls `/api/auth/login`.
- The frontend extracts a token from common response properties: `token`, `accessToken`, `jwt`, `access_token`, or nested `data`.
- The token is stored in `localStorage` as `clinicflow_token`.
- The user object is stored in `localStorage` as `clinicflow_user`.
- Logout clears both.
- Signup calls `/api/clinic-admin/users` with the stored Bearer token.
- Because the supplied signup API requires Authorization, signup is enabled only when a valid login token is present. If your intended product needs public self-registration, the backend endpoint must be changed to allow it.

## CORS

If the React app runs at `http://localhost:5173`, your Spring Boot backend must allow that origin for requests to `http://localhost:8080`.

The dashboard pages and modal actions that did not have APIs supplied remain UI/demo data from the original HTML. They are structured as React components and can be wired to your remaining backend endpoints next.
