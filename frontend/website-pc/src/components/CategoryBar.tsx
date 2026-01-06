// CategoryBar.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  MenuItem,
  Typography,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Collapse,
  CircularProgress,
} from "@mui/material";
import {
  KeyboardArrowDown,
  Menu as MenuIcon,
  ExpandMore,
  ExpandLess,
  VerifiedTwoTone,
  Category as CategoryIcon,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { api } from "../services/api";

interface ExtendedSubCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  originalCategory: string;
  description?: string;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface ExtendedCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | null;
  status?: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
  subcategories?: ExtendedSubCategory[];
  [key: string]: any;
}

const CategoryBar: React.FC = () => {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<ExtendedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategories, setShowCategories] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategories(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories", {
          // This endpoint is public; cookies are not required
          withCredentials: false,
        });
        const json = response.data;

        const cats: ExtendedCategory[] = Array.isArray(json)
          ? json
          : json?.data ?? [];

        if (!Array.isArray(cats)) {
          console.warn("Unexpected categories response shape:", json);
          setCategories([]);
          return;
        }

        cats.forEach((cat) => {
          if (cat.subcategories?.length) {
            cat.subcategories.forEach((sub) => {
              cats.push({
                ...sub,
                id: sub.id || "",
                name: sub.name || "",
                slug: sub.slug || "",
                parentId: cat.id || null,
                originalCategory: cat.name,
                status: sub.status || "active",
                description: sub.description || "",
                createdAt: sub.createdAt,
                updatedAt: sub.updatedAt,
              });
            });
          }
        });
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleMenuClose = () => {
    setExpandedCategory(null);
  };

  const toggleMobileCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const toggleDrawer = (open: boolean) => () => {
    setMobileDrawerOpen(open);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 2,
          bgcolor: "rgba(26, 26, 26, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <CircularProgress
          size={28}
          sx={{
            color: "#2196F3",
            animation: "pulse 1.5s ease-in-out infinite",
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.5 },
            },
          }}
        />
      </Box>
    );
  }

  // Desktop Menu
  const desktopMenu = (
    <Box
      ref={dropdownRef}
      sx={{
        display: { xs: "none", md: "flex" },
        alignItems: "center",

        position: "relative",
      }}
    >
      <Button
        color="inherit"
        onClick={(e) => {
          e.stopPropagation();
          setShowCategories(!showCategories);
        }}
        startIcon={<CategoryIcon />}
        sx={{
          color: "white",
          fontWeight: 700,
          textTransform: "none",
          fontSize: "1rem",
          px: 3,
          py: 1.5,
          borderRadius: "8px 8px 0 0",
          height: "100%",
          background: showCategories
            ? "linear-gradient(135deg, rgba(33, 150, 243, 0.2), rgba(76, 175, 80, 0.2))"
            : "transparent",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            color: "#FFD700",
            background:
              "linear-gradient(135deg, rgba(33, 150, 243, 0.3), rgba(76, 175, 80, 0.3))",
            transform: "translateY(-2px)",
            boxShadow: "0 4px 20px rgba(33, 150, 243, 0.3)",
          },
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          DANH MỤC
        </Typography>
        <KeyboardArrowDown
          sx={{
            ml: 0.5,
            transition: "transform 0.3s ease",
            transform: showCategories ? "rotate(180deg)" : "none",
          }}
        />
      </Button>

      {/* Categories dropdown */}
      <Box
        sx={{
          position: "absolute",
          top: "100%",
          left: 0,
          zIndex: 1200,
          minWidth: 320,
          maxHeight: showCategories ? "70vh" : 0,
          bgcolor: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          boxShadow: `
            0 20px 40px rgba(0,0,0,0.1),
            0 0 0 1px rgba(33, 150, 243, 0.1),
            inset 0 0 0 1px rgba(255, 255, 255, 0.1)
          `,
          borderRadius: "0 0 12px 12px",
          overflow: "hidden",
          mt: 1,
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: showCategories ? 1 : 0,
          visibility: showCategories ? "visible" : "hidden",
          p: showCategories ? 3 : 0,
          border: "1px solid rgba(33, 150, 243, 0.2)",
          borderTop: "2px solid #2196F3",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {categories.map((category) => (
          <Box key={category.id} sx={{ mb: 2.5 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                color: "#1a237e",
                display: "flex",
                alignItems: "center",
                gap: 1,
                pb: 1,
                borderBottom: "2px solid",
                borderColor: "rgba(33, 150, 243, 0.2)",
                "& a": {
                  color: "inherit",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                  position: "relative",
                  overflow: "hidden",
                  "&:hover": {
                    color: "#2196F3",
                    "&::after": {
                      transform: "translateX(0)",
                    },
                  },
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: -1,
                    left: 0,
                    width: "100%",
                    height: "2px",
                    background: "linear-gradient(90deg, #2196F3, #4CAF50)",
                    transform: "translateX(-100%)",
                    transition: "transform 0.3s ease",
                  },
                },
              }}
            >
              <Link
                to={`/product?category=${encodeURIComponent(category.slug)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategories(false);
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #2196F3, #4CAF50)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.875rem",
                      fontWeight: "bold",
                    }}
                  >
                    {category.name.charAt(0)}
                  </Box>
                  {category.name}
                </Box>
              </Link>
            </Typography>
            {category.subcategories && category.subcategories.length > 0 && (
              <Box sx={{ pl: 3, mb: 2 }}>
                {category.subcategories.map((subcategory) => (
                  <MenuItem
                    key={subcategory.id}
                    component={Link}
                    to={`/product?category=${encodeURIComponent(
                      subcategory.slug
                    )}`}
                    onClick={() => {
                      setShowCategories(false);
                      handleMenuClose();
                    }}
                    sx={{
                      px: 2.5,
                      py: 1.25,
                      borderRadius: 2,
                      mb: 1,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      "&:hover": {
                        bgcolor: "rgba(33, 150, 243, 0.08)",
                        transform: "translateX(8px)",
                        boxShadow: "0 4px 12px rgba(33, 150, 243, 0.1)",
                        "&::before": {
                          width: "4px",
                        },
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        height: "100%",
                        width: "0",
                        background:
                          "linear-gradient(to bottom, #2196F3, #4CAF50)",
                        transition: "width 0.3s ease",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: "#4CAF50",
                          flexShrink: 0,
                          opacity: 0.8,
                          boxShadow: "0 0 8px #4CAF50",
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: "text.primary",
                        }}
                      >
                        {subcategory.name}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );

  // Mobile Drawer
  const mobileDrawer = (
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={toggleDrawer(false)}
      sx={{
        "& .MuiDrawer-paper": {
          width: 320,
          maxWidth: "85vw",
          boxSizing: "border-box",
          background: "linear-gradient(135deg, #1a237e 0%, #311b92 100%)",
          color: "white",
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            pb: 2,
            borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: "white",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FFD700, #FF9800)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
              }}
            >
              <CategoryIcon />
            </Box>
            DANH MỤC
          </Typography>
          <IconButton
            onClick={toggleDrawer(false)}
            sx={{
              color: "white",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.2)",
                transform: "rotate(90deg)",
              },
              transition: "all 0.3s ease",
            }}
          >
            <ExpandLess sx={{ transform: "rotate(270deg)" }} />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 3, borderColor: "rgba(255, 255, 255, 0.1)" }} />

        <List sx={{ width: "100%" }}>
          {categories.map((category) => (
            <Box key={category.id}>
              {category.subcategories && category.subcategories.length > 0 ? (
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => toggleMobileCategory(category.id)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      bgcolor:
                        expandedCategory === category.id
                          ? "rgba(33, 150, 243, 0.2)"
                          : "transparent",
                      border: "1px solid",
                      borderColor:
                        expandedCategory === category.id
                          ? "rgba(33, 150, 243, 0.5)"
                          : "rgba(255, 255, 255, 0.1)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        bgcolor: "rgba(33, 150, 243, 0.15)",
                        borderColor: "rgba(33, 150, 243, 0.3)",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          fontWeight={600}
                          sx={{
                            color:
                              expandedCategory === category.id
                                ? "#FFD700"
                                : "white",
                          }}
                        >
                          {category.name}
                        </Typography>
                      }
                    />
                    {expandedCategory === category.id ? (
                      <ExpandLess sx={{ color: "#FFD700" }} />
                    ) : (
                      <ExpandMore sx={{ color: "rgba(255, 255, 255, 0.7)" }} />
                    )}
                  </ListItemButton>
                </ListItem>
              ) : (
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    to={`/product?category=${encodeURIComponent(
                      category.slug
                    )}`}
                    onClick={() => setMobileDrawerOpen(false)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        bgcolor: "rgba(33, 150, 243, 0.2)",
                        borderColor: "rgba(33, 150, 243, 0.5)",
                        transform: "translateX(4px)",
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          fontWeight={600}
                          sx={{ color: "white" }}
                        >
                          {category.name}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )}

              {category.subcategories && category.subcategories.length > 0 && (
                <Collapse
                  in={expandedCategory === category.id}
                  timeout="auto"
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    <ListItem disablePadding>
                      <ListItemButton
                        component={Link}
                        to={`/product?category=${encodeURIComponent(
                          category.slug
                        )}`}
                        onClick={() => setMobileDrawerOpen(false)}
                        sx={{
                          pl: 4,
                          py: 1.5,
                          borderRadius: 1,
                          mb: 0.5,
                          bgcolor: "rgba(0, 0, 0, 0.2)",
                          transition: "all 0.3s ease",
                          position: "relative",
                          overflow: "hidden",
                          "&:hover": {
                            bgcolor: "rgba(33, 150, 243, 0.3)",
                            pl: 5,
                            "&::before": {
                              width: "4px",
                            },
                          },
                          "&::before": {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: 0,
                            height: "100%",
                            width: "0",
                            background:
                              "linear-gradient(to bottom, #FFD700, #FF9800)",
                            transition: "width 0.3s ease",
                          },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              sx={{
                                color: "rgba(255, 255, 255, 0.9)",
                                fontWeight: 600,
                              }}
                            >
                              Tất cả {category.name}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                    {category.subcategories.map((subcategory) => (
                      <ListItem key={subcategory.id} disablePadding>
                        <ListItemButton
                          component={Link}
                          to={`/product?category=${encodeURIComponent(
                            subcategory.slug
                          )}`}
                          onClick={() => setMobileDrawerOpen(false)}
                          sx={{
                            pl: 4,
                            py: 1.5,
                            borderRadius: 1,
                            mb: 0.5,
                            bgcolor: "rgba(0, 0, 0, 0.2)",
                            transition: "all 0.3s ease",
                            position: "relative",
                            overflow: "hidden",
                            "&:hover": {
                              bgcolor: "rgba(33, 150, 243, 0.3)",
                              pl: 5,
                              "&::before": {
                                width: "4px",
                              },
                            },
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              left: 0,
                              top: 0,
                              height: "100%",
                              width: "0",
                              background:
                                "linear-gradient(to bottom, #FFD700, #FF9800)",
                              transition: "width 0.3s ease",
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "rgba(255, 255, 255, 0.9)",
                                  fontWeight: 500,
                                }}
                              >
                                {subcategory.name}
                              </Typography>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <>
      <AppBar
        position="static"
        sx={{
          background: `
            linear-gradient(135deg, 
              rgba(26, 35, 126, 0.98) 0%, 
              rgba(33, 33, 33, 0.98) 50%,
              rgba(48, 63, 159, 0.98) 100%)
          `,
          color: "white",
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
          height: { xs: 60, md: 70 },
          position: "relative",
          zIndex: 1100,
          backdropFilter: "blur(10px)",
          borderBottom: "2px solid rgba(33, 150, 243, 0.3)",
          "&::before": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, #2196F3, #4CAF50, #FFD700)",
            opacity: 0.7,
          },
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            sx={{
              minHeight: { xs: "60px !important", md: "70px !important" },
              py: { xs: 1, md: 1.5 },
              justifyContent: "space-between",
            }}
            disableGutters
          >
            {/* Desktop Menu */}
            <Box sx={{ display: { xs: "none", md: "block" }, flexGrow: 1 }}>
              {desktopMenu}
            </Box>

            {/* Mobile Menu Button */}
            <Box
              sx={{
                display: { xs: "flex", md: "none" },
                alignItems: "center",
                width: "100%",
              }}
            >
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={toggleDrawer(true)}
                sx={{
                  mr: 2,
                  bgcolor: "rgba(33, 150, 243, 0.2)",
                  border: "1px solid rgba(33, 150, 243, 0.3)",
                  "&:hover": {
                    bgcolor: "rgba(33, 150, 243, 0.3)",
                    transform: "rotate(90deg)",
                    boxShadow: "0 4px 15px rgba(33, 150, 243, 0.4)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                <MenuIcon />
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background: "linear-gradient(90deg, #FFD700, #FF9800)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                }}
              >
                DANH MỤC SẢN PHẨM
              </Typography>
            </Box>

            {/* Contact Info - Only show on desktop */}
            <Box
              sx={{
                display: { xs: "none", lg: "flex" },
                alignItems: "center",
                gap: 4,
              }}
            >
              <Box
                sx={{
                  textAlign: "center",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "rgba(76, 175, 80, 0.1)",
                  border: "1px solid rgba(76, 175, 80, 0.3)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 25px rgba(76, 175, 80, 0.3)",
                    bgcolor: "rgba(76, 175, 80, 0.2)",
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: "#4CAF50", fontWeight: 700 }}
                >
                  <VerifiedTwoTone
                    sx={{
                      verticalAlign: "middle",
                      color: "#4CAF50",
                      mr: 0.5,
                      fontSize: "1.2rem",
                    }}
                  />
                  CHẤT LƯỢNG ĐẢM BẢO
                </Typography>
              </Box>
              <Box
                sx={{
                  textAlign: "center",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "rgba(255, 152, 0, 0.1)",
                  border: "1px solid rgba(255, 152, 0, 0.3)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 25px rgba(255, 152, 0, 0.3)",
                    bgcolor: "rgba(255, 152, 0, 0.2)",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{ color: "#FF9800", fontSize: "0.875rem" }}
                >
                  ĐẶT PC TRONG NGÀY
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.75rem",
                  }}
                >
                  Không lo chọn sai
                </Typography>
              </Box>

              <Box
                sx={{
                  textAlign: "center",
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "rgba(33, 150, 243, 0.1)",
                  border: "1px solid rgba(33, 150, 243, 0.3)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    boxShadow: "0 8px 25px rgba(33, 150, 243, 0.3)",
                    bgcolor: "rgba(33, 150, 243, 0.2)",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  sx={{
                    color: "#2196F3",
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  📞 0386.165.820
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255, 255, 255, 0.8)",
                    fontSize: "0.75rem",
                  }}
                >
                  Tư vấn Build PC
                </Typography>
              </Box>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {mobileDrawer}
    </>
  );
};

export default CategoryBar;
