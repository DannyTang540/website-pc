import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
} from "react";
import MuiSnackbar from "@mui/material/Snackbar";
import MuiAlert, { type AlertColor } from "@mui/material/Alert";
import Slide from "@mui/material/Slide";
import type { SlideProps, SnackbarCloseReason } from "@mui/material";

interface SnackbarContextType {
  showSnackbar: (
    message: string,
    options?:
      | AlertColor
      | {
          severity?: AlertColor;
          autoHideDuration?: number | null;
          anchorOrigin?: {
            vertical: "top" | "bottom";
            horizontal: "left" | "center" | "right";
          };
          variant?: "filled" | "outlined" | "standard";
        }
  ) => void;
  closeSnackbar: () => void;
}

interface SnackbarProviderProps {
  children: React.ReactNode;
  defaultAutoHideDuration?: number | null;
  defaultAnchorOrigin?: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
  defaultVariant?: "filled" | "outlined" | "standard";
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
  autoHideDuration: number | null;
  anchorOrigin: {
    vertical: "top" | "bottom";
    horizontal: "left" | "center" | "right";
  };
  variant: "filled" | "outlined" | "standard";
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(
  undefined
);

const SlideTransition = (props: SlideProps) => {
  return <Slide {...props} direction="left" />;
};

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({
  children,
  defaultAutoHideDuration = 6000,
  defaultAnchorOrigin = { vertical: "top", horizontal: "right" },
  defaultVariant = "filled",
}) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
    autoHideDuration: defaultAutoHideDuration,
    anchorOrigin: defaultAnchorOrigin,
    variant: defaultVariant,
  });

  const showSnackbar = useCallback(
    (
      message: string,
      options?:
        | AlertColor
        | {
            severity?: AlertColor;
            autoHideDuration?: number | null;
            anchorOrigin?: {
              vertical: "top" | "bottom";
              horizontal: "left" | "center" | "right";
            };
            variant?: "filled" | "outlined" | "standard";
          }
    ) => {
      if (typeof options === "string") {
        setSnackbar((prev) => ({
          ...prev,
          open: true,
          message,
          severity: options,
        }));
        return;
      }

      const {
        severity = "info",
        autoHideDuration = defaultAutoHideDuration,
        anchorOrigin = defaultAnchorOrigin,
        variant = defaultVariant,
      } = options || {};

      setSnackbar((prev) => ({
        ...prev,
        open: true,
        message,
        severity,
        autoHideDuration,
        anchorOrigin,
        variant,
      }));
    },
    [defaultAutoHideDuration, defaultAnchorOrigin, defaultVariant]
  );

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleClose = useCallback(
    (_event?: Event | React.SyntheticEvent, reason?: SnackbarCloseReason) => {
      if (reason === "clickaway") {
        return;
      }
      closeSnackbar();
    },
    [closeSnackbar]
  );

  const handleExited = useCallback(() => {
    setSnackbar((prev) => ({
      ...prev,
      message: "",
      severity: "info",
    }));
  }, []);

  const value = useMemo(
    () => ({
      showSnackbar,
      closeSnackbar,
    }),
    [showSnackbar, closeSnackbar]
  );

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <MuiSnackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        anchorOrigin={snackbar.anchorOrigin}
        TransitionProps={{ onExited: handleExited }}
        sx={{
          "& .MuiAlert-root": {
            alignItems: "center",
          },
        }}
      >
        <MuiAlert
          onClose={handleClose}
          severity={snackbar.severity}
          variant={snackbar.variant}
          sx={{
            width: "100%",
            minWidth: 300,
            maxWidth: 450,
            borderRadius: 2,
            boxShadow: 3,
            "& .MuiAlert-message": {
              py: 0.5,
              display: "flex",
              alignItems: "center",
              minHeight: 40,
            },
          }}
          elevation={6}
        >
          {snackbar.message}
        </MuiAlert>
      </MuiSnackbar>
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error("useSnackbar must be used within a SnackbarProvider");
  }
  return context;
};

// Convenience hooks for common snackbar types
type ShowSnackbarOptions = Exclude<
  Parameters<SnackbarContextType["showSnackbar"]>[1],
  AlertColor
>;

export const useSuccessSnackbar = () => {
  const { showSnackbar } = useSnackbar();

  return useCallback(
    (message: string, options?: ShowSnackbarOptions | AlertColor) => {
      if (typeof options === "string") {
        showSnackbar(message, options);
      } else {
        showSnackbar(message, { ...options, severity: "success" });
      }
    },
    [showSnackbar]
  );
};

export const useErrorSnackbar = () => {
  const { showSnackbar } = useSnackbar();

  return useCallback(
    (message: string, options?: ShowSnackbarOptions | AlertColor) => {
      if (typeof options === "string") {
        showSnackbar(message, options);
      } else {
        showSnackbar(message, { ...options, severity: "error" });
      }
    },
    [showSnackbar]
  );
};

export const useWarningSnackbar = () => {
  const { showSnackbar } = useSnackbar();

  return useCallback(
    (message: string, options?: ShowSnackbarOptions | AlertColor) => {
      if (typeof options === "string") {
        showSnackbar(message, options);
      } else {
        showSnackbar(message, { ...options, severity: "warning" });
      }
    },
    [showSnackbar]
  );
};

export const useInfoSnackbar = () => {
  const { showSnackbar } = useSnackbar();

  return useCallback(
    (message: string, options?: ShowSnackbarOptions | AlertColor) => {
      if (typeof options === "string") {
        showSnackbar(message, options);
      } else {
        showSnackbar(message, { ...options, severity: "info" });
      }
    },
    [showSnackbar]
  );
};

export default useSnackbar;
