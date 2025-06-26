# 🧩 Drag-and-Drop Canvas Builder

A visual canvas built with **Next.js**, **React DnD**, and **Tailwind CSS**, where users can drag blocks (A or B) from a toolbox into a canvas. Blocks have simple rules, undo/redo functionality, and a custom right-click context menu.

---

## 🚀 Features

- ✅ Drag-and-drop blocks into canvas
- ⛓️ **Block B requires Block A** (dependency rule)
- 🖱️ Right-click any canvas block → shows "Hello World" context menu
- 🔄 Undo / Redo functionality with keyboard-safe buttons
- 🎨 Custom styling:
  - Background: `#0A0F10`
  - Canvas: white
  - Toolbox: light grey
  - Buttons: white with black text

---

## 🛠️ Tech Stack

- **Next.js (App Router)**
- **React DnD + HTML5 Backend**
- **Tailwind CSS**
- **TypeScript**

---

## 📦 Installation

 **Clone the Repository**
   ```bash
   git clone https://github.com/Chiragtyagi18/canvas.git
   cd canvas

canvas/
├── app/
│   └── page.tsx         # Main UI logic and drag-drop canvas
├── public/              # Public assets (if any)
├── styles/
│   └── globals.css      # Tailwind base styles
├── README.md
├── package.json
└── next.config.js

