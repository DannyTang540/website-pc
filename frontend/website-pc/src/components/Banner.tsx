// src/components/Banner.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  MobileStepper,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import { Link } from "react-router-dom";
import type { Banner } from "../types/banner";
import { getBanners } from "../services/bannerService";
import { API_BASE_URL } from "../services/api";

const BannerSlider: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const maxSteps = banners.length;

  useEffect(() => {
    const fetchActiveBanners = async () => {
      try {
        setError(null);
        const data = await getBanners();
        const active = (data || [])
          .filter((b) => b.isActive !== false)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setBanners(active);
      } catch (err) {
        console.error("Error fetching banners:", err);
        setError("Không tải được banner");
      } finally {
        setLoading(false);
      }
    };
    fetchActiveBanners();
  }, []);

  const resolveImage = useMemo(() => {
    const origin = API_BASE_URL.replace(/\/api\/?$/, "");
    return (img?: string) => {
      if (!img) return "";
      if (img.startsWith("http")) return img;
      return `${origin}${img.startsWith("/") ? "" : "/"}${img}`;
    };
  }, []);

  // Tự động chuyển slide
  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % banners.length);
    }, 5000); // Chuyển slide mỗi 5 giây

    return () => clearInterval(timer);
  }, [banners.length]);

  const handleNext = () => {
    setActiveStep((prev) => (prev + 1) % banners.length);
  };

  const handleBack = () => {
    setActiveStep((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (loading) {
    return (
      <Box sx={{ height: { xs: "300px", md: "400px" }, bgcolor: "grey.20" }} />
    );
  }

  if (error || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[activeStep];

  return (
    <Box sx={{ position: "relative", overflow: "hidden", width: "100%" }}>
      {/* Banner Image */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          paddingTop: "30%", // 3:1 aspect ratio (height/width = 1/3)
          [theme.breakpoints.down("md")]: {
            paddingTop: "50%", // 2:1 aspect ratio on mobile
          },
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url(${resolveImage(currentBanner.image)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            },
          }}
        >
          <Container
            maxWidth="lg"
            sx={{ position: "relative", zIndex: 1, height: "100%" }}
          >
            <Box
              sx={{
                color: "white",
                textAlign: { xs: "center", md: "left" },
                maxWidth: { md: "50%" },
                position: "relative",
                zIndex: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                py: 4,
              }}
            >
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: { xs: "2rem", md: "3rem" },
                  fontWeight: "bold",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                }}
              >
                {currentBanner.title}
              </Typography>

              <Typography
                variant="h5"
                component="p"
                gutterBottom
                sx={{
                  fontSize: { xs: "1rem", md: "1.5rem" },
                  mb: 3,
                  textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
                }}
              >
                {currentBanner.description}
              </Typography>

              {(currentBanner.link || currentBanner.targetUrl) && (
                <Box>
                  <Button
                    variant="contained"
                    size="large"
                    component={Link}
                    to={currentBanner.link || currentBanner.targetUrl}
                    sx={{
                      backgroundColor: "white",
                      color: "primary.main",
                      fontSize: "1.1rem",
                      paddingBottom: 10,
                      px: 4,
                      py: 1.5,
                      "&:hover": {
                        backgroundColor: "grey.100",
                        transform: "translateY(-2px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    {currentBanner.buttonText || "XEM THÊM"}
                  </Button>
                </Box>
              )}
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Navigation Arrows - chỉ hiện trên desktop */}
      {!isMobile && banners.length > 1 && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              position: "relative",
              height: "100%",
              width: "100%",
              pointerEvents: "none",
            }}
          >
            <Button
              size="small"
              onClick={handleBack}
              sx={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "white",
                backgroundColor: "rgba(0,0,0,0.3)",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.6)",
                },
                minWidth: "auto",
                width: 48,
                height: 48,
                borderRadius: "50%",
                pointerEvents: "auto",
              }}
            >
              <KeyboardArrowLeft />
            </Button>

            <Button
              size="small"
              onClick={handleNext}
              sx={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "white",
                backgroundColor: "rgba(0,0,0,0.3)",
                "&:hover": {
                  backgroundColor: "rgba(0,0,0,0.6)",
                },
                minWidth: "auto",
                width: 48,
                height: 48,
                borderRadius: "50%",
                pointerEvents: "auto",
              }}
            >
              <KeyboardArrowRight />
            </Button>
          </Container>
        </Box>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <MobileStepper
          steps={maxSteps}
          position="static"
          activeStep={activeStep}
          sx={{
            backgroundColor: "transparent",
            justifyContent: "center",
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            "& .MuiMobileStepper-dot": {
              backgroundColor: "rgba(255,255,255,0.4)",
              "&.MuiMobileStepper-dotActive": {
                backgroundColor: "white",
              },
            },
          }}
          nextButton={null}
          backButton={null}
        />
      )}
      {/* Dots Indicator */}
      {banners.length > 1 && (
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            zIndex: 2,
          }}
        >
          <MobileStepper
            steps={maxSteps}
            position="static"
            activeStep={activeStep}
            sx={{
              backgroundColor: "transparent",
              justifyContent: "center",
              "& .MuiMobileStepper-dot": {
                backgroundColor: "rgba(255,255,255,0.4)",
                "&.MuiMobileStepper-dotActive": {
                  backgroundColor: "white",
                },
              },
            }}
            nextButton={null}
            backButton={null}
          />
        </Box>
      )}
    </Box>
  );
};

export default BannerSlider;
