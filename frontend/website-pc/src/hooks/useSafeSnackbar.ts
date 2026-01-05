import { useSnackbar, SnackbarKey, OptionsObject } from "notistack";
import { useCallback, useRef } from "react";

interface SafeSnackbar {
  enqueueSnackbar: (message: string, options?: OptionsObject) => SnackbarKey;
  closeSnackbar: (key?: SnackbarKey) => void;
}

export const useSafeSnackbar = (): SafeSnackbar => {
  const isProviderAvailable = useRef(true);

  try {
    const snackbar = useSnackbar();
    return snackbar;
  } catch {
    isProviderAvailable.current = false;
  }

  // Fallback khi không có SnackbarProvider
  const enqueueSnackbar = useCallback(
    (message: string, options?: OptionsObject): SnackbarKey => {
      console.log(`[Snackbar] ${message}`, options);
      return "" as SnackbarKey;
    },
    []
  );

  const closeSnackbar = useCallback(() => {}, []);

  return { enqueueSnackbar, closeSnackbar };
};
