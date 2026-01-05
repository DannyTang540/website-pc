import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, RegisterData } from "../types/auth";
import { authService } from "../services/authService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Computed property để kiểm tra role admin
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Auth check failed:", error);
        // Clear invalid tokens
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
  try {
    setLoading(true);
    console.log("Attempting login with:", { email }); // Không log mật khẩu
    
    const { user: userData, token } = await authService.login({
      email,
      password,
    });

    console.log("Login successful, user role:", userData?.role);
    setUser(userData);

    if (token) {
      localStorage.setItem("token", token);
      console.log("Token saved to localStorage");
    }

    return userData;
  } catch (error: any) {
    console.error("Login failed:", {
      message: error.message,
      stack: error.stack,
    });
    // Ném lại lỗi để component xử lý UI
    throw error;
  } finally {
    setLoading(false);
  }
};
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      const { user: newUser, token } = await authService.register(userData);

      // Default to user role for new registrations
      const userWithRole = {
        ...newUser,
        role: "user" as const,
      };

      setUser(userWithRole);

      // Store token if provided
      if (token) {
        localStorage.setItem("token", token);
      }
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  const value: AuthContextType = {
    user,
    loading,
    isAdmin,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
