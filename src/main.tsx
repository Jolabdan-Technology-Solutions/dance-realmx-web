import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/globals.css'
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { FirebaseAuthProvider } from "./hooks/use-firebase-auth-new";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <FirebaseAuthProvider>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </FirebaseAuthProvider>
  </QueryClientProvider>
);
