# Buy From Egypt – Backend

<p align="center"> <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white"/> <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white"/> <img src="https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white"/> <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white"/> <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white"/> <img src="https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white"/> <img src="https://img.shields.io/badge/License-UNLICENSED-yellow?style=for-the-badge&logo=opensourceinitiative&logoColor=black"/> </p>

## Overview

**Buy From Egypt** is a **modular, scalable, and secure backend system** built with **NestJS and Node.js**, designed to **facilitate trade for Egyptian suppliers and international importers**.

It provides **RESTful APIs and real-time communication** for managing products, users, orders, chat, notifications, AI-based recommendations, and more.

**Key Features:**

- Modular and maintainable architecture
- JWT-based authentication & role-based access control
- Real-time messaging & notifications via **Socket.IO**
- Product, post, and category management with Cloudinary image upload
- Personalized recommendations powered by ML
- Secure email notifications and Twilio SMS integration

---

## 🚀 Tech Stack

- **Framework:** NestJS 11
- **Database ORM:** Prisma (PostgreSQL)
- **Authentication & Security:** JWT, Bcrypt
- **File Uploads:** Multer + Cloudinary
- **Real-Time Communication:** [Socket.IO](https://socket.io/)
- **API Documentation:** OpenAPI 3.0 / Swagger
- **Notifications & Messaging:** Twilio (SMS), Nodemailer (Email)
- **Other:** Express 5, Slugify, UUID

---

## Features

- 🔑 User authentication & authorization (JWT)
- 👨‍💻 Role-based access control (Admin / User / Importer / Exporter)
- 📦 Product management (CRUD, image uploads, slugs)
- 🛒 Cart & wishlist management
- 💳 Orders and checkout integration
- 📨 Email notifications with Nodemailer
- 🔔 Real-time chat and notifications (Socket.IO)
- ⭐ Reviews, ratings, and social interactions
- 📊 Categories, subcategories, and brand management
- 🔒 Security: bcrypt password hashing, input validation, CORS

---

## Tech Stack

- **Backend Framework:** NestJS
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT + bcrypt
- **Validation:** class-validator + class-transformer
- **File Upload:** Multer + Cloudinary
- **Email & SMS:** Nodemailer + Twilio
- **Real-Time:** Socket.IO
- **Utilities:** slugify, uuid

---

## Project Structure

```bash
BuyFromEgypt/
├── src/
│   auth/
│   categories/
│   chat/
│   chatbot/
│   comment-likes/
│   common/
│   egyptian-economic-context/
│   export/
│   follow/
│   mail-service/
│   notification/
│   posts/
│   products/
│   rating/
│   recommendation/
│   save-items/
│   search/
│   social-media/
│   sync/
│   user-preference/
│   users/
│   app.controller.ts
│   app.module.ts
│   app.service.ts
│   main.ts
├── prisma/
├── test/
├── package.json
└── tsconfig.json

```

---

## Installation & Setup

### Clone & Navigate

```bash
git clone https://github.com/Buy-From-Egypt/BuyFromEgypt-Backend.git
cd BuyFromEgypt-Backend
```

### Install Dependencies

```bash
npm install
```

### Database & Start Server

```bash
npx prisma migrate dev
npm run start:dev
```

---

## Environment Variables

```
PORT=3000
SITE_NAME=buyfromegypt
SITE_LINK=https://buy-from-egypt-frontend.vercel.app

DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

JWT_SECRET=your_jwt_secret
JWT_EXPIRE_IN=1h

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloud_api_key
CLOUDINARY_API_SECRET=your_cloud_api_secret

MAIL_USER=your_email@example.com
MAIL_PASS=your_email_password

TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## API Modules & Endpoints

### 1. **Auth**

- `POST /api/v1/auth/register` – Register a new user
- `POST /api/v1/auth/login` – Login user
- `POST /api/v1/auth/logout` – Logout user
- `POST /api/v1/auth/request-reset` – Request password reset
- `POST /api/v1/auth/verify-otp` – Verify OTP
- `POST /api/v1/auth/verify-otp-link` – Verify OTP link
- `POST /api/v1/auth/reset-password` – Reset password

### 2. **Users**

- `GET /api/v1/users/admin`
- `POST /api/v1/users/admin`
- `GET /api/v1/users/profile`
- `PUT/PATCH /api/v1/users/profile`
- `GET /api/v1/users/{id}`
- `PUT /api/v1/users/admin/{id}`
- `DELETE /api/v1/users/admin/{id}`
- `PUT /api/v1/users/admin/approveUser/{id}`
- `PUT /api/v1/users/admin/deactivateUser/{id}`
- `GET /api/v1/users/{id}/summary`

### 3. **Products**

- `POST /api/v1/products`
- `GET /api/v1/products` – With filters & pagination
- `GET /api/v1/products/categories-with-count`
- `PATCH /api/v1/products/{id}`
- `DELETE /api/v1/products/{id}`
- `GET /api/v1/products/{id}`
- `PUT /api/v1/products/admin/{id}/{action}`
- `POST /api/v1/products/{id}/save`
- `DELETE /api/v1/products/{id}/save`
- `GET /api/v1/products/saved`

### 4. **Posts**

- `POST /api/v1/posts`
- `GET /api/v1/posts`
- `PATCH /api/v1/posts/{id}`
- `DELETE /api/v1/posts/{id}`
- `GET /api/v1/posts/{id}`
- `GET /api/v1/posts/{id}/summary`
- `POST /api/v1/posts/{id}/save`
- `DELETE /api/v1/posts/{id}/save`
- `GET /api/v1/posts/saved`

### 5. **Comments & Likes**

- `POST /api/v1/comments`
- `GET/PATCH/DELETE /api/v1/comments/{commentId}`
- `GET /api/v1/comments/allComments/{postId}`
- `POST /api/v1/comment-likes/{commentId}/like`
- `POST /api/v1/comment-likes/{commentId}/dislike`
- `DELETE /api/v1/comment-likes/{commentId}/reaction`
- `GET /api/v1/comment-likes/{commentId}/reactions`
- `GET /api/v1/comment-likes/{commentId}/likes/count`
- `GET /api/v1/comment-likes/{commentId}/dislikes/count`

### 6. **Categories**

- `POST /api/v1/categories`
- `GET /api/v1/categories`
- `GET/PUT/DELETE /api/v1/categories/{id}`

### 7. **Follow**

- `POST /api/v1/follow`
- `GET /api/v1/follow/followers/{userId}`
- `GET /api/v1/follow/followers`
- `GET /api/v1/follow/following/{userId}`
- `GET /api/v1/follow/following`

### 8. **Chat & Notifications (Socket.IO + REST)**

- `GET /api/v1/chat/conversations`
- `GET /api/v1/chat/messages`
- `POST /api/v1/chat/sendMessage`
- `PATCH /api/v1/chat/updateMessage`
- `PATCH /api/v1/chat/markAsRead`
- `GET /api/v1/chat/onlineStatus`
- `GET /api/v1/notifications`

> Note: Socket.IO powers real-time chat and notifications, delivering instant updates and messages between users.
> 

### 9. **Search**

- `GET /api/v1/search`
- `GET /api/v1/search/history`
- `DELETE /api/v1/search/history`

### 10. **Social Media**

- `POST /api/v1/social-media`
- `GET /api/v1/social-media`
- `GET /api/v1/social-media/{id}`
- `PATCH/DELETE /api/v1/social-media/{id}`
- `GET /api/v1/social-media/platform/{platform}`

### 11. **Rating & Save Items**

- `POST /api/v1/rating/{entityType}/{entityId}`
- `GET /api/v1/rating/{entityType}/{entityId}`
- `GET /api/v1/rating/{entityType}/{entityId}/all`
- `GET /api/v1/save-items/{entityType}/{userId}`

### 12. **Chatbot & Recommendation**

- `POST /api/v1/chatbot/chat`
- `POST /api/v1/chatbot/chat/reset`
- `GET /api/v1/chatbot/industry/{name}`
- `POST /api/v1/recommendation/products`
- `POST /api/v1/recommendation/posts`

### 13. **User Preferences & Sync**

- `POST /api/v1/user-preference`
- `GET /api/v1/user-preference/me`
- `POST /api/v1/sync/user`
- `POST /api/v1/sync/product`
- `POST /api/v1/sync/order`
- `POST /api/v1/sync/all`

### 14. **Admin & Export**

- `POST /api/v1/admin/retrain`
- `GET /api/v1/export/recommendations/customer/{customerId}`
- `GET /api/v1/export/recommendations/business/{businessName}`

### 15. **Egyptian Economic Context**

- `GET /api/v1/egyptian-economic-context`

---

## Contributing

1. Fork the repository
2. Create a branch (`git checkout -b feature/new`)
3. Commit your changes (`git commit -m "Add feature"`)
4. Push (`git push origin feature/new`)
5. Open a Pull Request

---

## License

This project is **UNLICENSED** – private use only.
