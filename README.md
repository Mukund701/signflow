# SignFlow ✍️

A full-stack, real-time document signing platform that allows users to securely upload PDFs, send signature requests via email, and track document statuses in a modern, minimalist dashboard. 

## 🌟 Key Features

* **Real-Time Collaboration:** Powered by Socket.io to instantly update document statuses across clients when a signature is completed.
* **Secure Email Workflows:** Generates secure, expiring JWT-based links sent directly to signers via Nodemailer.
* **Sleek, Minimalist UI:** Built with Shadcn UI and Tailwind CSS, featuring a professional dark-mode aesthetic and responsive design.
* **Dashboard Analytics:** Visualizes document statuses (Total, Pending, Signed) using interactive Recharts.
* **Authentication & Security:** Robust JWT user authentication and secure routing.
* **Cloud Storage & Database:** Leverages Supabase (PostgreSQL) for scalable data management and secure document storage.

## 🛠️ Tech Stack

**Frontend**
* Next.js 16 (App Router)
* React & TypeScript
* Tailwind CSS & Shadcn UI
* Recharts (Data Visualization)
* Socket.io-client

**Backend**
* Node.js & Express
* TypeScript
* Socket.io (WebSockets)
* Nodemailer (SMTP Email Delivery)
* JSON Web Tokens (JWT)

**Database & Storage**
* Supabase (PostgreSQL)

## 🚀 Getting Started

Follow these steps to set up the project locally on your machine.

### Prerequisites
* Node.js (v18 or higher)
* A Supabase account and project
* A Gmail account with an App Password generated

### 1. Clone the Repository
```bash
git clone [https://github.com/Mukund701/signflow.git](https://github.com/Mukund701/signflow.git)
cd signflow
