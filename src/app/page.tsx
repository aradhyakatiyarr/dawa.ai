"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  Camera, Upload, ShieldCheck, Pill, Info, MapPin, 
  AlertCircle, Loader2, Volume2, RefreshCw, CheckCircle, 
  TrendingDown, Map, HeartHandshake, PhoneCall, User,
  LogOut, Settings, Trash2, Search, Building, DollarSign,
  ChevronDown, UserCheck, BarChart3, X, Check
} from "lucide-react";
import { PharmacyStore, storesDatabase } from "@/data/stores";

// Dynamically import Leaflet Map to avoid SSR errors
const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

// Safe LocalStorage helpers for Next.js SSR/prerender compatibility
const safeGetLocalStorage = (key: string, defaultValue: string): string => {
  if (typeof window === "undefined") return defaultValue;
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const safeSetLocalStorage = (key: string, value: string) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error(e);
    }
  }
};

const safeRemoveLocalStorage = (key: string) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(e);
    }
  }
};

// Toast notification interface
interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

export default function Home() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<"scan" | "map" | "admin">("scan");
  
  // User Session States (Local Storage Persistence)
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Auth Form Fields
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Profile Form Fields
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileCurrentPassword, setProfileCurrentPassword] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Scanner & Upload States
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [textMedicineName, setTextMedicineName] = useState("");
  
  // File input references
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Map & Location States
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoStores, setGeoStores] = useState<PharmacyStore[]>([]);

  // Multi-lingual Language State
  const [selectedLang, setSelectedLang] = useState<"en" | "hi" | "ta" | "te">("en");
  
  // Text-To-Speech (TTS) Voice State
  const [speaking, setSpeaking] = useState(false);

  // History & Database simulation states
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");

  // Toast State
  const [toast, setToast] = useState<Toast | null>(null);

  // Dropdown ref for close on click outside
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // City Coordinates for Map Default Centers
  const cityCenters: Record<string, [number, number]> = {
    Delhi: [28.6304, 77.2177],
    Bangalore: [12.9716, 77.5946],
    Mumbai: [19.0178, 72.8428],
    Hyderabad: [17.4483, 78.3741],
    Chennai: [13.0418, 80.2341],
  };

  // Toast trigger helper
  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Client-side Image Compressor to fit under body size limits
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Limit max width/height to 800px for speedy payloads
        const MAX_SIZE = 800;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7)); // Compress to 70% quality JPEG
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => resolve(base64Str);
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize DB & Session on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Create local storage schemas if not exist
      if (!localStorage.getItem("dawa_users")) {
        // Bootstrap admin account
        localStorage.setItem("dawa_users", JSON.stringify([
          {
            id: "admin-id",
            name: "Administrator",
            email: "admin@dawa.ai",
            passwordHash: "admin123", // Simple hash/text mock
            role: "ADMIN",
            createdAt: new Date().toISOString()
          }
        ]));
      }
      if (!localStorage.getItem("dawa_scans")) {
        localStorage.setItem("dawa_scans", JSON.stringify([]));
      }

      // Check existing session
      const savedSession = localStorage.getItem("dawa_session");
      if (savedSession) {
        const sessionUser = JSON.parse(savedSession);
        setUser(sessionUser);
        setProfileName(sessionUser.name);
        setProfileEmail(sessionUser.email);
      }
      setAuthLoading(false);
    }
  }, []);

  // Load User Scan History
  const loadHistory = () => {
    if (!user) {
      setHistory([]);
      return;
    }
    const allScans = JSON.parse(safeGetLocalStorage("dawa_scans", "[]"));
    // Filter scans by logged-in user and search query
    const userScans = allScans.filter((scan: any) => scan.userId === user.id);
    
    if (historySearch) {
      const query = historySearch.toLowerCase();
      const filtered = userScans.filter((scan: any) => 
        scan.brandName.toLowerCase().includes(query) ||
        (scan.genericName && scan.genericName.toLowerCase().includes(query)) ||
        scan.category.toLowerCase().includes(query)
      );
      setHistory(filtered);
    } else {
      setHistory(userScans);
    }
  };

  // Reload history when user or search query changes
  useEffect(() => {
    loadHistory();
  }, [user, historySearch]);

  // Admin Dashboard Calculations
  const adminStats = useMemo(() => {
    const allUsers = JSON.parse(safeGetLocalStorage("dawa_users", "[]"));
    const allScans = JSON.parse(safeGetLocalStorage("dawa_scans", "[]"));
    
    const validScansWithSavings = allScans.filter((s: any) => s.savingsPercent !== null && s.savingsPercent !== undefined);
    
    const avgSavingsPercent = validScansWithSavings.length > 0
      ? Math.round(validScansWithSavings.reduce((acc: number, cur: any) => acc + cur.savingsPercent, 0) / validScansWithSavings.length)
      : 76; // Default realistic savings percentage

    const totalAmountSaved = Math.round(
      allScans.reduce((acc: number, cur: any) => acc + (cur.savingsAmount || 0), 0)
    ) || 1240; // Default dashboard fallback if empty

    return {
      totalUsers: allUsers.length,
      totalScans: allScans.length,
      avgSavingsPercent,
      totalAmountSaved
    };
  }, [activeTab]);

  const adminUsersList = useMemo(() => {
    const allUsers = JSON.parse(safeGetLocalStorage("dawa_users", "[]"));
    const allScans = JSON.parse(safeGetLocalStorage("dawa_scans", "[]"));
    
    return allUsers.map((u: any) => {
      const scanCount = allScans.filter((s: any) => s.userId === u.id).length;
      return {
        ...u,
        scanCount
      };
    });
  }, [activeTab]);

  // Location Geoproximity Mock generator
  const generateStoresNearCoordinates = (lat: number, lng: number): PharmacyStore[] => {
    return [
      {
        id: "geo-store-1",
        name: "Jan Aushadhi Kendra - 1.2 km away",
        lat: lat + 0.005,
        lng: lng + 0.003,
        address: "Shop No. 4, Local Market complex, Sector Road",
        phone: "+91 99112 23344",
        city: "Nearby"
      },
      {
        id: "geo-store-2",
        name: "Janaushadhi Store - 2.5 km away",
        lat: lat - 0.008,
        lng: lng + 0.006,
        address: "Ground Floor, Health Plaza, Metro Station road",
        phone: "+91 98877 66554",
        city: "Nearby"
      },
      {
        id: "geo-store-3",
        name: "Pradhan Mantri Generic Pharmacy - 3.8 km away",
        lat: lat + 0.012,
        lng: lng - 0.010,
        address: "Opposite Civil Hospital Gate 2, Link Road",
        phone: "+91 88776 65544",
        city: "Nearby"
      }
    ];
  };

  const mapCenter = useMemo(() => {
    if (userLocation) return userLocation;
    return cityCenters[selectedCity] || [28.6304, 77.2177];
  }, [selectedCity, userLocation]);

  // Combined store marker outputs
  const storesToDisplay = useMemo(() => {
    if (userLocation) return geoStores;
    return storesDatabase.filter(store => store.city === selectedCity);
  }, [selectedCity, userLocation, geoStores]);

  // Geolocation trigger
  const handleFindMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        const mockNearby = generateStoresNearCoordinates(latitude, longitude);
        setGeoStores(mockNearby);
        setLocating(false);
        setActiveTab("map");
        triggerToast("Location calibrated - displaying nearest stores!");
      },
      (error) => {
        console.error("Error fetching location:", error);
        alert("Unable to retrieve your location. Please select a city manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Image Upload Handling (supports any file size via client-side compression)
  const processImageFile = async (file: File) => {
    setError(null);
    setAnalyzing(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        // Compress base64 payload to fit Vercel boundaries
        const compressed = await compressImage(rawBase64);
        setImage(compressed);
        
        // Analyze image
        await analyzeMedicine(compressed);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError("Failed to process image file.");
      setAnalyzing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleCameraCaptureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Call API route to analyze medicine
  const analyzeMedicine = async (imgData: string) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imgData })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze image");
      }

      setResult(data);

      // Save scan logs locally to localStorage if user logged in
      if (user) {
        const allScans = JSON.parse(safeGetLocalStorage("dawa_scans", "[]"));
        const newRecord = {
          id: "scan-" + Date.now(),
          userId: user.id,
          brandName: data.scannedMedicine.brandName,
          manufacturer: data.scannedMedicine.manufacturer || "Unknown",
          category: data.scannedMedicine.category || "General",
          activeIngredients: data.scannedMedicine.activeIngredients || [],
          genericName: data.genericAlternative?.genericName || null,
          genericPrice: data.genericAlternative?.genericPrice || null,
          brandPrice: data.genericAlternative?.brandPrice || null,
          savingsAmount: data.genericAlternative ? (data.genericAlternative.brandPrice - data.genericAlternative.genericPrice) : 0,
          savingsPercent: data.genericAlternative ? Math.round(((data.genericAlternative.brandPrice - data.genericAlternative.genericPrice) / data.genericAlternative.brandPrice) * 100) : 0,
          safetyExplanation: data.safetyExplanation,
          createdAt: new Date().toISOString()
        };
        allScans.unshift(newRecord);
        safeSetLocalStorage("dawa_scans", JSON.stringify(allScans));
        loadHistory(); // Refresh history sidebar
        triggerToast("Scan saved to your history!");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while analyzing the medicine.");
      triggerToast("Analysis failed", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  // Submit text search query for medicine
  const handleTextSearchSubmit = async () => {
    if (!textMedicineName.trim()) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setImage(null); // Clear image when searching by text

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textMedicineName })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to find generic medicine alternatives");
      }

      setResult(data);
      setTextMedicineName(""); // Clear query input on success

      // Save to localStorage scan history
      if (user) {
        const allScans = JSON.parse(safeGetLocalStorage("dawa_scans", "[]"));
        const newRecord = {
          id: "scan-" + Date.now(),
          userId: user.id,
          brandName: data.scannedMedicine.brandName,
          manufacturer: data.scannedMedicine.manufacturer || "Generic Alternate India",
          category: data.scannedMedicine.category || "General",
          activeIngredients: data.scannedMedicine.activeIngredients || [],
          genericName: data.genericAlternative?.genericName || null,
          genericPrice: data.genericAlternative?.genericPrice || null,
          brandPrice: data.genericAlternative?.brandPrice || null,
          savingsAmount: data.genericAlternative ? (data.genericAlternative.brandPrice - data.genericAlternative.genericPrice) : 0,
          savingsPercent: data.genericAlternative ? Math.round(((data.genericAlternative.brandPrice - data.genericAlternative.genericPrice) / data.genericAlternative.brandPrice) * 100) : 0,
          safetyExplanation: data.safetyExplanation,
          createdAt: new Date().toISOString()
        };
        allScans.unshift(newRecord);
        safeSetLocalStorage("dawa_scans", JSON.stringify(allScans));
        loadHistory();
        triggerToast("Search details saved to history!");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while searching for the medicine.");
      triggerToast("Search failed", "error");
    } finally {
      setAnalyzing(false);
    }
  };

  // Trigger analysis for mock / sample medicines
  const loadSample = (sampleKey: string) => {
    setImage(null);
    analyzeMedicine(sampleKey);
  };

  // Text-To-Speech (TTS) safety explanation
  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      if (speaking) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      let matchedVoice = null;

      if (selectedLang === "hi") {
        matchedVoice = voices.find(v => v.lang.includes("hi-IN") || v.lang.includes("hi_IN"));
      } else if (selectedLang === "ta") {
        matchedVoice = voices.find(v => v.lang.includes("ta-IN") || v.lang.includes("ta_IN"));
      } else if (selectedLang === "te") {
        matchedVoice = voices.find(v => v.lang.includes("te-IN") || v.lang.includes("te_IN"));
      } else {
        matchedVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("en_IN"));
      }

      if (matchedVoice) utterance.voice = matchedVoice;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported on this browser.");
    }
  };

  // Cancel speech on language changes
  useEffect(() => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [selectedLang]);

  // Auth Handling: Login/Signup via localStorage
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    // Simulated short server delay
    setTimeout(() => {
      try {
        const allUsers = JSON.parse(localStorage.getItem("dawa_users") || "[]");
        const lowerEmail = authEmail.toLowerCase();

        if (authMode === "login") {
          // Log In Validation
          const matchedUser = allUsers.find((u: any) => u.email === lowerEmail);
          if (!matchedUser) {
            throw new Error("Invalid email address. Please register an account.");
          }
          if (matchedUser.passwordHash !== authPassword) {
            throw new Error("Incorrect password. Please try again.");
          }

          // Set session
          localStorage.setItem("dawa_session", JSON.stringify(matchedUser));
          setUser(matchedUser);
          setProfileName(matchedUser.name);
          setProfileEmail(matchedUser.email);
          setShowAuthModal(false);
          triggerToast(`Welcome back, ${matchedUser.name}!`);
        } else {
          // Sign Up Validation
          if (!authName || !authEmail || !authPassword || !authConfirmPassword) {
            throw new Error("All registration fields are required.");
          }
          if (authPassword !== authConfirmPassword) {
            throw new Error("Passwords do not match.");
          }
          if (authPassword.length < 6) {
            throw new Error("Password must be at least 6 characters long.");
          }
          
          const isRegistered = allUsers.some((u: any) => u.email === lowerEmail);
          if (isRegistered) {
            throw new Error("This email is already registered.");
          }

          // Create User
          const newUser = {
            id: "user-" + Date.now(),
            name: authName,
            email: lowerEmail,
            passwordHash: authPassword,
            role: lowerEmail === "admin@dawa.ai" ? "ADMIN" : "USER", // Admin bootstrap
            createdAt: new Date().toISOString()
          };

          allUsers.push(newUser);
          localStorage.setItem("dawa_users", JSON.stringify(allUsers));
          
          // Set session
          localStorage.setItem("dawa_session", JSON.stringify(newUser));
          setUser(newUser);
          setProfileName(newUser.name);
          setProfileEmail(newUser.email);
          setShowAuthModal(false);
          triggerToast("Account created successfully!");
        }

        // Clear fields
        setAuthName("");
        setAuthEmail("");
        setAuthPassword("");
        setAuthConfirmPassword("");
      } catch (err: any) {
        setAuthError(err.message || "Authentication failed.");
      } finally {
        setAuthSubmitting(false);
      }
    }, 800);
  };

  // Logout Handling
  const handleLogout = () => {
    localStorage.removeItem("dawa_session");
    setUser(null);
    setResult(null);
    setImage(null);
    setHistory([]);
    setActiveTab("scan");
    triggerToast("Logged out successfully");
  };

  // Profile Update Handling (localStorage)
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSubmitting(true);

    setTimeout(() => {
      try {
        const allUsers = JSON.parse(localStorage.getItem("dawa_users") || "[]");
        const lowerEmail = profileEmail.toLowerCase();
        
        const userIndex = allUsers.findIndex((u: any) => u.id === user.id);
        if (userIndex === -1) {
          throw new Error("User session invalid. Please log in again.");
        }

        // Email duplicate check
        if (lowerEmail !== user.email) {
          const emailExists = allUsers.some((u: any) => u.email === lowerEmail && u.id !== user.id);
          if (emailExists) {
            throw new Error("Email is already in use by another account.");
          }
        }

        const dbUser = allUsers[userIndex];

        // Optional password update
        if (profileNewPassword) {
          if (!profileCurrentPassword) {
            throw new Error("Current password is required to change passwords.");
          }
          if (dbUser.passwordHash !== profileCurrentPassword) {
            throw new Error("Incorrect current password.");
          }
          if (profileNewPassword.length < 6) {
            throw new Error("New password must be at least 6 characters long.");
          }
          dbUser.passwordHash = profileNewPassword;
        }

        dbUser.name = profileName;
        dbUser.email = lowerEmail;

        allUsers[userIndex] = dbUser;
        localStorage.setItem("dawa_users", JSON.stringify(allUsers));
        localStorage.setItem("dawa_session", JSON.stringify(dbUser));
        
        setUser(dbUser);
        setShowProfileModal(false);
        setProfileCurrentPassword("");
        setProfileNewPassword("");
        triggerToast("Profile details updated successfully!");
      } catch (err: any) {
        setProfileError(err.message || "Failed to update profile.");
      } finally {
        setProfileSubmitting(false);
      }
    }, 800);
  };

  // Delete scan from history
  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this scan from history?")) return;

    const allScans = JSON.parse(localStorage.getItem("dawa_scans") || "[]");
    const filtered = allScans.filter((s: any) => s.id !== id);
    localStorage.setItem("dawa_scans", JSON.stringify(filtered));
    loadHistory();
    triggerToast("Record removed");
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (!confirm("Are you sure you want to clear your entire scan history? This action cannot be undone.")) return;

    const allScans = JSON.parse(localStorage.getItem("dawa_scans") || "[]");
    const filtered = allScans.filter((s: any) => s.userId !== user.id);
    localStorage.setItem("dawa_scans", JSON.stringify(filtered));
    loadHistory();
    triggerToast("All history cleared");
  };

  // Load history item into result card
  const handleSelectHistoryItem = (scan: any) => {
    setResult({
      scannedMedicine: {
        brandName: scan.brandName,
        activeIngredients: scan.activeIngredients,
        manufacturer: scan.manufacturer,
        category: scan.category
      },
      genericAlternative: scan.genericName ? {
        brandName: scan.brandName,
        genericName: scan.genericName,
        genericPrice: scan.genericPrice,
        brandPrice: scan.brandPrice,
        salts: scan.activeIngredients.map((s: any) => `${s.name} ${s.strength}`),
        quantityText: "10 Tablets",
        category: scan.category
      } : null,
      safetyExplanation: scan.safetyExplanation
    });
    setActiveTab("scan");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Admin Update Role
  const handleUpdateUserRole = (targetUserId: string, newRole: string) => {
    if (targetUserId === user.id) {
      alert("You cannot change your own admin role.");
      return;
    }
    const allUsers = JSON.parse(localStorage.getItem("dawa_users") || "[]");
    const userIndex = allUsers.findIndex((u: any) => u.id === targetUserId);
    if (userIndex !== -1) {
      allUsers[userIndex].role = newRole;
      localStorage.setItem("dawa_users", JSON.stringify(allUsers));
      triggerToast("User role updated successfully");
      loadAdminData(); // Triggers UI re-render
    }
  };

  // Admin Delete User
  const handleDeleteUser = (targetUserId: string) => {
    if (targetUserId === user.id) {
      alert("You cannot delete your own admin account.");
      return;
    }
    if (!confirm("Are you sure you want to delete this user? All their history will be cleared.")) return;

    const allUsers = JSON.parse(localStorage.getItem("dawa_users") || "[]");
    const filteredUsers = allUsers.filter((u: any) => u.id !== targetUserId);
    localStorage.setItem("dawa_users", JSON.stringify(filteredUsers));

    const allScans = JSON.parse(localStorage.getItem("dawa_scans") || "[]");
    const filteredScans = allScans.filter((s: any) => s.userId !== targetUserId);
    localStorage.setItem("dawa_scans", JSON.stringify(filteredScans));

    triggerToast("User removed from platform");
    loadAdminData();
  };

  // Stub to trigger useMemo updates for admin lists
  const [adminTick, setAdminTick] = useState(0);
  const loadAdminData = () => {
    setAdminTick(t => t + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative">
      
      {/* Toast Alert overlay */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[9999] p-4 rounded-xl shadow-lg border flex items-center gap-2 animate-bounce transition-all ${
          toast.type === "error" 
            ? "bg-rose-50 border-rose-200 text-rose-800" 
            : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Hidden file input triggers for camera upload and gallery */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handleImageUpload} 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        accept="image/*" 
        capture="environment" 
        onChange={handleCameraCaptureChange} 
        className="hidden" 
      />

      {/* Navbar Banner */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 text-slate-800 py-3.5 px-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-sm">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">DawaAI</h1>
              <p className="text-slate-400 text-[10px] sm:text-xs font-semibold mt-1">Generic Medicine Savings Assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab("scan")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === "scan" 
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold shadow-sm" 
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 border border-transparent font-semibold"
              }`}
            >
              💊 Scanner
            </button>
            <button
              onClick={() => setActiveTab("map")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                activeTab === "map" 
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold shadow-sm" 
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 border border-transparent font-semibold"
              }`}
            >
              📍 Locator
            </button>

            {user?.role === "ADMIN" && (
              <button
                onClick={() => { setActiveTab("admin"); loadAdminData(); }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  activeTab === "admin" 
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold shadow-sm" 
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80 border border-transparent font-semibold"
                }`}
              >
                ⚙️ Admin
              </button>
            )}

            {/* Auth Button/Dropdown */}
            <div className="relative ml-1 sm:ml-2" ref={dropdownRef}>
              {authLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              ) : user ? (
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100/50 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-sm focus:outline-none transition cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span className="max-w-[70px] truncate hidden md:inline">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow transition cursor-pointer"
                >
                  Sign In
                </button>
              )}

              {/* Avatar menu dropdown */}
              {showUserDropdown && user && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 border border-slate-100 text-slate-700 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">LOGGED IN AS</p>
                    <p className="text-xs font-bold truncate text-slate-800">{user.name}</p>
                  </div>
                  
                  <button
                    onClick={() => { setShowProfileModal(true); setShowUserDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 transition"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Profile Settings</span>
                  </button>

                  <button
                    onClick={() => { handleClearAllHistory(); setShowUserDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-rose-600 flex items-center gap-2 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Clear History</span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>
                  
                  <button
                    onClick={() => { handleLogout(); setShowUserDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-800 flex items-center gap-2 transition font-bold"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT/MAIN CONTAINER */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {activeTab === "scan" && (
            <>
              {/* Image Input Container */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-5">
                <div>
                  <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Camera className="text-emerald-600 w-5.5 h-5.5" />
                    Identify Brand Medicine
                  </h2>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    Take a photo of the tablet strip front/back or upload packaging. The scanner matches salts, lists 90% cheaper generic alternatives, and displays regional safety guides.
                  </p>
                </div>

                {/* Main Capture Area */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 hover:border-emerald-300 rounded-2xl relative overflow-hidden h-[240px] flex flex-col items-center justify-center transition-all p-4">
                  
                  {analyzing ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                      <h3 className="font-bold text-slate-700 text-base animate-pulse">Analyzing Medicine Pack...</h3>
                      <p className="text-slate-400 text-xs mt-1.5">Generating price comparisons & translations</p>
                    </div>
                  ) : image ? (
                    <div className="w-full h-full relative flex items-center justify-center bg-slate-900 rounded-xl">
                      <img 
                        src={image} 
                        alt="Captured medicine packaging" 
                        className="max-w-full max-h-full object-contain"
                      />
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <button
                          onClick={() => { setImage(null); setError(null); setResult(null); }}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl shadow-md text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-4">
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mb-3">
                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-md font-bold text-sm flex items-center justify-center gap-2 transition"
                        >
                          <Camera className="w-4 h-4" />
                          Capture Photo (Camera)
                        </button>
                        
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl shadow-md font-bold text-sm flex items-center justify-center gap-2 transition"
                        >
                          <Upload className="w-4 h-4" />
                          Upload packaging Image
                        </button>
                      </div>
                      <p className="text-slate-400 text-xs">Supports files of any size (auto-compressed). Keep tablet names clear.</p>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <p className="font-bold text-sm">Analysis Failed</p>
                      <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{error}</p>
                    </div>
                  </div>
                )}

                {/* Text Medicine Search Input option */}
                <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Or type brand medicine name directly
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={textMedicineName}
                      onChange={(e) => setTextMedicineName(e.target.value)}
                      placeholder="e.g. Augmentin, Calpol, Pan-40, Crocin, Telma, Zifi..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && textMedicineName.trim() && !analyzing) {
                          handleTextSearchSubmit();
                        }
                      }}
                      className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all font-semibold shadow-inner"
                    />
                    <button
                      onClick={handleTextSearchSubmit}
                      disabled={analyzing || !textMedicineName.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-sm transition-all hover:shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span>Search</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Analysis Result Box */}
              {result && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom duration-300">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <ShieldCheck className="text-emerald-600 w-5.5 h-5.5" />
                    Comparative Pricing Report
                  </h3>

                  {/* Price Comparison Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Branded Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative flex flex-col justify-between min-h-[160px]">
                      <div>
                        <div className="absolute right-0 top-0 bg-slate-200 text-slate-700 px-3 py-1 text-[9px] font-bold uppercase rounded-bl-lg">
                          Branded
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1 mt-2">{result.scannedMedicine.brandName}</h4>
                        <p className="text-slate-400 text-xs mb-3 font-medium">Mfg: {result.scannedMedicine.manufacturer}</p>
                        
                        <div className="mb-4">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wide">Chemical Salt:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {result.scannedMedicine.activeIngredients?.map((item: any, idx: number) => (
                              <span key={idx} className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-xs font-bold">
                                {item.name} {item.strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
                        <span className="text-slate-500 text-sm">Estimated Brand Cost:</span>
                        <span className="text-xl font-black text-slate-800">
                          ₹{result.genericAlternative?.brandPrice ? result.genericAlternative.brandPrice.toFixed(2) : "120.00"}
                        </span>
                      </div>
                    </div>

                    {/* Generic Card */}
                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 relative flex flex-col justify-between min-h-[160px]">
                      <div>
                        <div className="absolute right-0 top-0 bg-emerald-600 text-white px-3 py-1 text-[9px] font-bold uppercase rounded-bl-lg">
                          Generic Equivalent
                        </div>
                        
                        {result.genericAlternative ? (
                          <>
                            <h4 className="font-bold text-emerald-950 text-lg leading-tight mb-1 mt-2">
                              {result.genericAlternative.genericName}
                            </h4>
                            <p className="text-emerald-600 text-xs mb-3 font-semibold">PM Janaushadhi Store Capped Code</p>
                            
                            <div className="mb-4">
                              <span className="text-emerald-800/60 text-[10px] uppercase font-bold tracking-wide">Capped Salts:</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {result.genericAlternative.salts?.map((salt: string, idx: number) => (
                                  <span key={idx} className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-xs font-bold">
                                    {salt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm mt-2">Generic Salts Identified</h4>
                            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                              No identical match in our local catalog, but generic versions are widely available matching salts:
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {result.scannedMedicine.activeIngredients?.map((item: any, idx: number) => (
                                <span key={idx} className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-xs font-bold">
                                  {item.name} {item.strength}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {result.genericAlternative ? (
                        <div className="border-t border-emerald-200 pt-3 flex items-baseline justify-between">
                          <span className="text-emerald-800 text-sm font-semibold">Jan Aushadhi Price:</span>
                          <span className="text-2xl font-black text-emerald-700">₹{result.genericAlternative.genericPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <p className="text-emerald-700 text-xs font-bold mt-4">Save up to 80% with equivalent generic formula.</p>
                      )}
                    </div>
                  </div>

                  {/* Savings Banner Card */}
                  {result.genericAlternative && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-4.5 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2.5 rounded-xl">
                          <TrendingDown className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Calculated Savings Margin</p>
                          <p className="text-lg font-black mt-0.5">
                            Save ₹{(result.genericAlternative.brandPrice - result.genericAlternative.genericPrice).toFixed(2)} per strip
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-white text-emerald-700 font-black px-3.5 py-1.5 rounded-xl text-lg shadow-sm">
                          -{Math.round(((result.genericAlternative.brandPrice - result.genericAlternative.genericPrice) / result.genericAlternative.brandPrice) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Multilingual AI Safety Explainer */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-4">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                        <Info className="text-emerald-600 w-5 h-5" />
                        Multilingual AI Safety Guide
                      </h4>

                      {/* Language Selection Buttons */}
                      <div className="flex flex-wrap gap-1 bg-slate-200 p-1 rounded-xl">
                        {(["en", "hi", "ta", "te"] as const).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setSelectedLang(lang)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              selectedLang === lang 
                                ? "bg-white text-slate-800 shadow-sm" 
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            {lang === "en" ? "English" : lang === "hi" ? "हिंदी" : lang === "ta" ? "தமிழ்" : "తెలుగు"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Explanations Details */}
                    {result.safetyExplanation?.[selectedLang] && (
                      <div className="space-y-4">
                        
                        {/* Audio Guide Button */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              const exp = result.safetyExplanation[selectedLang];
                              const speechText = `${exp.purpose}. ${exp.howToUse}. ${exp.sideEffects}. ${exp.warnings}`;
                              handleSpeak(speechText);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-sm transition-all ${
                              speaking 
                                ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" 
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <Volume2 className={`w-4 h-4 ${speaking ? "animate-pulse" : ""}`} />
                            {speaking ? "Stop Audio Guide" : "Listen Audio Guide"}
                          </button>
                        </div>

                        {/* Safety Text Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wide mb-1">📋 Purpose / संकेत</h5>
                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">{result.safetyExplanation[selectedLang].purpose}</p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wide mb-1">⏱ How To Use / खुराक</h5>
                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">{result.safetyExplanation[selectedLang].howToUse}</p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-xl border border-slate-200">
                            <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wide mb-1">🤢 Side Effects / दुष्प्रभाव</h5>
                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">{result.safetyExplanation[selectedLang].sideEffects}</p>
                          </div>

                          <div className="bg-white p-4 rounded-xl border border-rose-100 bg-rose-50/20">
                            <h5 className="font-bold text-xs text-rose-500 uppercase tracking-wide mb-1">⚠️ Precautions / सावधानियां</h5>
                            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-semibold">{result.safetyExplanation[selectedLang].warnings}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "map" && (
            /* MAP CONTAINER */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Map className="text-emerald-600" />
                    Jan Aushadhi Kendra Locator
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">Explore official government generic pharmacies</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedCity}
                    onChange={(e) => {
                      setSelectedCity(e.target.value);
                      setUserLocation(null);
                    }}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Delhi">New Delhi</option>
                    <option value="Bangalore">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                  </select>

                  <button
                    onClick={handleFindMe}
                    disabled={locating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg font-bold text-sm shadow transition flex items-center gap-1.5"
                    title="Find stores near my location"
                  >
                    {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    <span>Near Me</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Leaflet Map */}
              <MapComponent 
                stores={storesToDisplay} 
                center={mapCenter}
                userLocation={userLocation}
              />
              
              {/* Info Disclaimer */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex gap-3 text-xs text-slate-600 leading-relaxed">
                <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <p>
                  Jan Aushadhi Kendras are official pharmacies launched by the **Department of Pharmaceuticals, Govt of India** to supply top-quality medicines at pocket-friendly rates. Prices listed are standard DPCO catalog caps.
                </p>
              </div>
            </div>
          )}

          {activeTab === "admin" && user?.role === "ADMIN" && (
            /* ADMIN CONSOLE */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="text-emerald-600" />
                  Admin Dashboard Console
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">Real-time platform statistics and user administration</p>
              </div>

              {/* Admin Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Registered Users</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{adminStats.totalUsers}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Scans</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{adminStats.totalScans}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Avg. Savings</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{adminStats.avgSavingsPercent}%</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Estimated Saved</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">₹{adminStats.totalAmountSaved}</p>
                </div>
              </div>

              {/* Users Admin Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-2">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-bold text-xs text-slate-600 uppercase tracking-wider">
                  User Management Registry
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-semibold">
                        <th className="p-3">User Details</th>
                        <th className="p-3">Role</th>
                        <th className="p-3 text-center">Scans</th>
                        <th className="p-3">Joined Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {adminUsersList.map((u: any) => (
                        <tr key={u.id} className="hover:bg-slate-50 text-slate-700">
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{u.name}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">{u.email}</p>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide ${
                              u.role === "ADMIN" 
                                ? "bg-rose-100 text-rose-800" 
                                : "bg-slate-100 text-slate-800"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-900">
                            {u.scanCount}
                          </td>
                          <td className="p-3 text-slate-500 font-medium">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              onClick={() => handleUpdateUserRole(u.id, u.role === "ADMIN" ? "USER" : "ADMIN")}
                              className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline cursor-pointer"
                            >
                              Toggle Role
                            </button>
                            <span className="text-slate-300">|</span>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


        </div>

        {/* RIGHT SIDE PANEL */}
        <div className="flex flex-col gap-6">
          
          {/* User History sidebar widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="text-emerald-600 w-5 h-5" />
                Scan History
              </h3>
              {user && history.length > 0 && (
                <button
                  onClick={handleClearAllHistory}
                  className="text-rose-600 hover:text-rose-700 text-xs font-semibold hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>

            {user ? (
              <>
                {/* History Search */}
                <div className="relative border border-slate-200 rounded-lg flex items-center px-2 bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search history..."
                    className="w-full text-xs bg-transparent py-2 px-1 focus:outline-none text-slate-700"
                  />
                  {historySearch && (
                    <button onClick={() => setHistorySearch("")}>
                      <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>

                {/* History Items list */}
                {history.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs leading-relaxed">
                    {historySearch ? "No matching records found." : "No scans yet. Start scanning medicines!"}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {history.map((scan) => (
                      <div
                        key={scan.id}
                        onClick={() => handleSelectHistoryItem(scan)}
                        className="bg-slate-50 border border-slate-200 hover:border-emerald-200 p-3 rounded-xl cursor-pointer hover:bg-emerald-50/10 transition-all flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 text-xs truncate">{scan.brandName}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {scan.genericName ? "Generic Match ✓" : "Salts Identified"}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-1">
                            {new Date(scan.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {scan.savingsPercent ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                              -{scan.savingsPercent}%
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-700 text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                              info
                            </span>
                          )}
                          <button
                            onClick={(e) => handleDeleteHistory(e, scan.id)}
                            className="text-slate-400 hover:text-rose-600 transition"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 text-center text-xs text-slate-500 leading-relaxed">
                <Info className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <p className="font-bold text-slate-700 mb-1">Track Your Savings</p>
                <p className="mb-4 text-slate-400">Create a free account to save scan logs, calculate cumulative savings, and view your prescription history.</p>
                <button
                  onClick={() => { setAuthMode("signup"); setShowAuthModal(true); }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition w-full"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Near Me Locations widget */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-emerald-600" />
              Nearest Stores Location
            </h3>
            
            <p className="text-slate-500 text-xs leading-relaxed">
              Locate where you can purchase these affordable generic drugs. Enable location or choose a city.
            </p>

            <button
              onClick={handleFindMe}
              disabled={locating}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-3 rounded-xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 w-full"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <MapPin className="w-4.5 h-4.5 text-emerald-600" />}
              <span>{userLocation ? "Location Calibrated ✓" : "Detect Current Location"}</span>
            </button>

            {/* List of Nearest Stores */}
            <div className="space-y-3 mt-2 overflow-y-auto max-h-[300px] pr-1">
              {storesToDisplay.map((store) => (
                <div key={store.id} className="bg-slate-50 border border-slate-200/80 hover:border-emerald-200 rounded-xl p-3.5 transition flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-slate-800 text-xs leading-snug">{store.name}</h4>
                      {store.distance !== undefined && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          {store.distance.toFixed(1)} km
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[10px] leading-relaxed mt-1">{store.address}</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-200/60 mt-3 pt-2">
                    <a 
                      href={`tel:${store.phone}`} 
                      className="text-[10px] text-slate-500 font-semibold hover:text-emerald-600 flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3 text-emerald-600" />
                      <span>Call Store</span>
                    </a>
                    
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[10px] font-bold text-emerald-700 px-2.5 py-1 rounded-md transition"
                    >
                      Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* Core medical disclaimer bottom, spanning full width above footer */}
      <div className="max-w-6xl w-full mx-auto px-4 md:px-6 mb-6">
        <div className="bg-yellow-50/70 border border-yellow-200/80 text-yellow-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-yellow-705" />
          <div className="text-xs">
            <p className="font-bold">Medical Information Disclaimer</p>
            <p className="mt-0.5 leading-relaxed text-yellow-900">
              DawaAI is designed for consumer awareness, pricing comparison, and health literacy only. It **does not** provide medical advice, diagnosis, or treatment. Always consult a certified physician or pharmacist before substituting any medication. Do not stop prescribed treatment without medical consent.
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-200/80 text-xs mt-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-semibold text-slate-500">© 2026 DawaAI. Built for PM Bhartiya Janaushadhi Awareness Campaign.</p>
          <div className="flex gap-4">
            <a href="https://janaushadhi.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 transition font-bold">Official Govt Portal</a>
            <span className="text-slate-300">|</span>
            <a href="#" className="hover:text-emerald-600 transition font-bold">Terms of Use</a>
          </div>
        </div>
      </footer>

      {/* AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[999] backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800">
                {authMode === "login" ? "Sign In to DawaAI" : "Create DawaAI Account"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === "login" ? "Welcome back! Login to save history logs" : "Register a free account to track your generic medicine savings"}
              </p>

              <form onSubmit={handleAuthSubmit} className="space-y-4 mt-6">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all font-medium"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all font-medium"
                  />
                </div>

                {authMode === "signup" && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      placeholder="Retype password"
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all font-medium"
                    />
                  </div>
                )}

                {authError && (
                  <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2 border border-rose-200 leading-relaxed">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  {authSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>{authMode === "login" ? "Log In" : "Register Account"}</span>
                </button>
              </form>

              <div className="text-center mt-4">
                <button
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "signup" : "login");
                    setAuthError(null);
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                >
                  {authMode === "login" ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE SETTINGS MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[999] backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-slate-100 animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => {
                setShowProfileModal(false);
                setProfileError(null);
                setProfileCurrentPassword("");
                setProfileNewPassword("");
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-6">
              <h3 className="text-xl font-bold text-slate-800">Profile Settings</h3>
              <p className="text-xs text-slate-400 mt-1">Update your account information or change your password</p>

              <form onSubmit={handleProfileSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Change Password (Optional)</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Current Password</label>
                      <input
                        type="password"
                        value={profileCurrentPassword}
                        onChange={(e) => setProfileCurrentPassword(e.target.value)}
                        placeholder="Current password"
                        className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Password</label>
                      <input
                        type="password"
                        value={profileNewPassword}
                        onChange={(e) => setProfileNewPassword(e.target.value)}
                        placeholder="New password (min 6 chars)"
                        className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                {profileError && (
                  <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2 border border-rose-200 leading-relaxed">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>{profileError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  {profileSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
