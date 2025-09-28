// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import DocsPage from "./pages/docspage";
import { ChatPage } from "./pages/chatpage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DocsPage />} />
        <Route path="/chat/:collectionId" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
