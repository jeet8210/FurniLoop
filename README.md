# FurniLoop

FurniLoop is a customer-to-customer furniture marketplace built with React, Express, and MongoDB. Every member can use one account to buy and sell.

## Run locally

1. Install Node.js 20+ and MongoDB locally, or create a MongoDB Atlas database.
2. Copy `.env.example` to `.env`. Set `MONGODB_URI` and replace `JWT_SECRET` with a long random value.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:5173`. The API runs at `http://localhost:5000`.

## Available marketplace flows

- Account registration and login with bcrypt password hashes and HTTP-only JWT cookies.
- Email verification, resend verification, forgot-password, and password reset links (SMTP configured, or printed to the API console in local development).
- Public furniture browsing with text search, categories, recent-first ordering, and price sorting.
- Listing detail views with seller, condition, price, location, material, dimensions, and description.
- Authenticated listing creation, editing, pausing, and marking as sold.
- Up to 8 listing photos, 5 MB each; uses Cloudinary when configured, with local-folder fallback for development.
- Saved listings, real-time Socket.IO conversations, and offers with accept, decline, and counter actions.
- Persistent in-app notifications for messages, offers, transaction updates, and reviews.
- Accepted offers create direct-sale arrangements; either member can mark an arrangement complete or cancel it.
- Public seller profiles with verified-transaction reviews, listing reports, and a protected admin area for moderation, members, reviews, and categories.
- About and FAQ content sections on the storefront.

## API overview

- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/admin-login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/favorites`
- `GET /api/listings`, `GET /api/listings/:id`, `GET /api/listings/mine`, `POST /api/listings`, `PATCH /api/listings/:id`, `DELETE /api/listings/:id`
- `POST /api/uploads`
- `GET/POST /api/conversations`, `GET/POST /api/conversations/:id/messages`
- `GET /api/notifications`, `PATCH /api/notifications/:id/read`, `POST /api/notifications/read-all`
- `GET/POST /api/offers`, `PATCH /api/offers/:id`
- `GET/PATCH /api/transactions`, `GET/POST /api/reviews`, `GET /api/reviews/user/:id`
- `GET /api/categories`; admin category creation, update, and deletion
- `POST /api/reports`
- `/api/admin/*` for admin-only statistics, listing review, user status, reviews, and reports

## Admin setup

New accounts receive the `user` role. Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 12 characters), and optionally `ADMIN_NAME` in `.env`, then run `npm run admin:create`. This creates or updates the administrator account and marks its email verified. The admin login ID is the `ADMIN_EMAIL` value; its password is the `ADMIN_PASSWORD` value you chose. There are no built-in default credentials. Open **Log in → Administrator sign in** to use the separate admin login flow.

## Current scope notes

Payment and delivery remain arranged directly between the buyer and seller. An accepted offer creates an `ARRANGING` transaction record; the listing becomes `SOLD` when either member marks it complete. Set SMTP values to send account emails. Set the three Cloudinary values to use durable image storage; the local upload folder is only a development fallback. About and FAQ content is currently hard-coded rather than admin-editable CMS content.

## Production build

Run `npm run build` to create the React client bundle in `dist/`. Configure `CLIENT_URL`, `SERVER_URL`, `MONGODB_URI`, and `JWT_SECRET` for the deployment environment before starting the API.
