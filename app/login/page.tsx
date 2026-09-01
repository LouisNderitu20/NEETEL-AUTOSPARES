"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";

interface LoginForm {
  email: string;
  password: string;
}

interface SignupForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("reason") === "timeout") {
      toast.warn("You have been logged out due to inactivity for security reasons.", {
        toastId: "session-timeout-toast",
      });
      
      const newUrl = window.location.pathname;
      window.history.replaceState({ path: newUrl }, "", newUrl);
    }
  }, []);

  
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin },
  } = useForm<LoginForm>();

  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: errorsSignup },
    reset: resetSignup,
  } = useForm<SignupForm>();

  
  const onLoginSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.success("Login successful! Redirecting...");
        window.location.href = "/dashboard/overview";
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  
  const onSignupSubmit = async (data: SignupForm) => {
    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok) {
        toast.error(resData.error || "Failed to register.");
      } else {
        toast.success("Account created successfully! Auto-signing in...");

        
        const loginResult = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (loginResult?.error) {
          toast.info("Registration complete. Please sign in.");
          setIsSignUp(false);
          resetSignup();
        } else {
          window.location.href = "/dashboard/overview";
        }
      }
    } catch (error) {
      toast.error("Could not complete registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer theme="dark" position="top-right" />
      <div className="login-bg d-flex align-items-center justify-content-center p-3">
        <div className="card shadow-lg p-4 p-md-5 glass" style={{ maxWidth: "440px", width: "100%" }}>
          <form onSubmit={handleSubmitLogin(onLoginSubmit)} noValidate>
            <div className="d-flex align-items-center gap-2 mb-3 justify-content-center">
              <div className="login-logo-circle d-flex" style={{ overflow: "hidden", background: "none", width: "40px", height: "40px" }}>
                <img src="/logo.jpg" alt="NEETEL Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <h2 className="h4 fw-bold mb-0 text-center">Welcome Back</h2>
            </div>
            <p className="text-muted mb-4 text-center" style={{ fontSize: "0.82rem" }}>
              Sign in to your <strong>NEETEL AUTOSPARES</strong> account
            </p>

            {}
            <div className="mb-3">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  className={`form-control ${errorsLogin.email ? "is-invalid" : ""}`}
                  placeholder="your@email.com"
                  {...registerLogin("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email",
                    },
                  })}
                />
                {errorsLogin.email && (
                  <div className="invalid-feedback">{errorsLogin.email.message}</div>
                )}
              </div>
            </div>

            {}
            <div className="mb-4">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`form-control ${errorsLogin.password ? "is-invalid" : ""}`}
                  placeholder="Password"
                  {...registerLogin("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  className="input-group-text"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
                {errorsLogin.password && (
                  <div className="invalid-feedback">{errorsLogin.password.message}</div>
                )}
              </div>
            </div>

            {}
            <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="text-center mt-4">
              <p className="mb-0 text-muted" style={{ fontSize: "0.75rem" }}>
                Internal Garage Management System • NEETEL AUTOSPARES
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
