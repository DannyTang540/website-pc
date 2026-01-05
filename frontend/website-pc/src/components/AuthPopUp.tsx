import React from "react";
import { Dialog, DialogContent } from "@mui/material";
import AuthForm from "./AuthForm";

interface AuthPopupProps {
  open: boolean;
  onClose: () => void;
}

const AuthPopup: React.FC<AuthPopupProps> = ({ open, onClose }) => {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <AuthForm onSuccess={handleSuccess} showTabs={true} />
      </DialogContent>
    </Dialog>
  );
};

export default AuthPopup;
