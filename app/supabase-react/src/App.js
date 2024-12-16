import "./index.css";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Chat } from "./components/Chat";
import { ChatProvider } from "./contexts/ChatContext";
import { AuthProvider } from "./contexts/AuthContext";

const SUPABASE_PROJECT_URL = process.env.REACT_APP_SUPABASE_URL;
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;
const REDIRECT_TO = process.env.REACT_APP_REDIRECT_TO ?? window.location.origin;

// Initialize the Supabase client
const supabase = createClient(SUPABASE_PROJECT_URL, ANON_KEY);

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", color: "red" }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
      })
      .catch((err) => {
        console.error("Error getting session:", err);
        setError(err);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Cleanup subscription
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  if (error) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        Error: {error.message}
      </div>
    );
  }

  if (!session) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "20px",
            backgroundColor: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          <ErrorBoundary>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: "#404040",
                      brandAccent: "#2d2d2d",
                    },
                  },
                },
              }}
              providers={[
                "google",
                // Can enable other providers
                // 'github',
              ]}
              redirectTo={REDIRECT_TO}
            />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider supabase={supabase}>
      <ChatProvider>
        <Chat />
      </ChatProvider>
    </AuthProvider>
  );
}
