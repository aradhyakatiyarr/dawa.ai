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

// Toast notification interface
interface Toast {
  type: "success" | "error" | "info";
  message: string;
}

export default function Home() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<"scan" | "map" | "admin">("scan");
  
  // User Session States
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
  const [useCamera, setUseCamera] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  
  // Media Stream Ref for camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Map & Location States
  const [selectedCity, setSelectedCity] = useState("Delhi");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  // Multi-lingual Language State
  const [selectedLang, setSelectedLang] = useState<"en" | "hi" | "ta" | "te">("en");
  
  // Text-To-Speech (TTS) Voice State
  const [speaking, setSpeaking] = useState(false);

  // History States
  const [history, setHistory] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  // Admin Dashboard States
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // Toast State
  const [toast, setToast] = useState<Toast | null>(null);

  // Dropdown ref for close on click outside
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // City Coordinates for Map Default Centers
  const cityCenters: Record<string, [number, number]> = {
    Delhi: [28.6139, 77.2090],
    Bangalore: [12.9716, 77.5946],
    Mumbai: [19.0760, 72.8777],
    Hyderabad: [17.3850, 78.4867],
    Chennai: [13.0827, 80.2707],
  };

  // Toast trigger helper
  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
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

  // Fetch Session User on Mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setProfileName(data.user.name);
          setProfileEmail(data.user.email);
        }
      } catch (err) {
        console.error("Session fetch failed:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    fetchSession();
  }, []);

  // Load User Scan History when logged in
  const loadHistory = async (query = "") => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/history?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.scans || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load history on login or search trigger
  useEffect(() => {
    if (user) {
      loadHistory(historySearch);
    } else {
      setHistory([]);
    }
  }, [user, historySearch]);

  // Load Admin Stats if admin tab activated
  const loadAdminData = async () => {
    if (!user || user.role !== "ADMIN") return;
    setAdminLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setAdminStats(data.stats);
        setAdminUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "admin") {
      loadAdminData();
    }
  }, [activeTab]);

  const mapCenter = useMemo(() => {
    if (userLocation) return userLocation;
    return cityCenters[selectedCity] || [28.6139, 77.2090];
  }, [selectedCity, userLocation]);

  // Filter stores based on selected city
  const filteredStores = useMemo(() => {
    return storesDatabase.filter(store => store.city === selectedCity);
  }, [selectedCity]);

  // Sort stores by distance if user location is available
  const sortedStores = useMemo(() => {
    if (!userLocation) return filteredStores;

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Radius of the earth in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c; // Distance in km
    };

    return [...storesDatabase]
      .map(store => ({
        ...store,
        distance: calculateDistance(userLocation[0], userLocation[1], store.lat, store.lng)
      }))
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 5); // Return top 5 nearest
  }, [userLocation, filteredStores]);

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
        setLocating(false);
        setActiveTab("map"); // Automatically switch to map tab
      },
      (error) => {
        console.error("Error fetching location:", error);
        alert("Unable to retrieve your location. Please select a city manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Camera Management
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setUseCamera(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("Unable to access camera. Please upload an image instead.");
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        setImage(dataUrl);
        stopCamera();
      }
    }
  };

  // Handle image upload via input file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit. Please upload a smaller image.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Call the Next.js API route to analyze medicine
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

      // If user is logged in, save the scan to history
      if (user) {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scannedMedicine: data.scannedMedicine,
            genericAlternative: data.genericAlternative,
            safetyExplanation: data.safetyExplanation
          })
        });
        loadHistory(); // Reload history sidebar
        triggerToast("Scan saved to history");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while analyzing the medicine.");
      triggerToast("Analysis failed", "error");
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

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      
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

  // Auth Handling: Login/Signup
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    const apiEndpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const payload = authMode === "login" 
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword, confirmPassword: authConfirmPassword };

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      setUser(data.user);
      setProfileName(data.user.name);
      setProfileEmail(data.user.email);
      setShowAuthModal(false);
      triggerToast(`Welcome back, ${data.user.name}!`);

      // Reset fields
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthConfirmPassword("");
    } catch (err: any) {
      setAuthError(err.message || "An error occurred during authentication.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Logout Handling
  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        setUser(null);
        setResult(null);
        setImage(null);
        setHistory([]);
        setActiveTab("scan");
        triggerToast("Logged out successfully");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Profile Update Handling
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSubmitting(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          currentPassword: profileCurrentPassword,
          newPassword: profileNewPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Profile update failed");
      }

      setUser(data.user);
      setShowProfileModal(false);
      setProfileCurrentPassword("");
      setProfileNewPassword("");
      triggerToast("Profile updated successfully");
    } catch (err: any) {
      setProfileError(err.message || "An error occurred.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Delete scan from history
  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Avoid triggering loading history details
    if (!confirm("Are you sure you want to delete this scan from history?")) return;

    try {
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadHistory(historySearch);
        triggerToast("Record deleted");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Clear all history
  const handleClearAllHistory = async () => {
    if (!confirm("Are you sure you want to clear your entire scan history? This action cannot be undone.")) return;

    try {
      const res = await fetch("/api/history", { method: "DELETE" });
      if (res.ok) {
        loadHistory();
        triggerToast("All history cleared");
      }
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
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
  const handleUpdateUserRole = async (targetUserId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/stats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, newRole })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("User role updated");
      loadAdminData(); // Refresh grid
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    }
  };

  // Admin Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? Their entire history will be deleted.")) return;

    try {
      const res = await fetch(`/api/admin/stats?userId=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      triggerToast("User deleted successfully");
      loadAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
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

      {/* Navbar Banner */}
      <header className="bg-emerald-600 text-white shadow-md py-4 px-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white text-emerald-600 p-2 rounded-xl shadow">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">DawaAI</h1>
              <p className="text-emerald-100 text-xs hidden sm:block">AI-Powered Generic Medicine savings assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("scan");
                stopCamera();
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "scan" 
                  ? "bg-white text-emerald-700 shadow" 
                  : "hover:bg-emerald-500 text-white"
              }`}
            >
              💊 Scanner
            </button>
            <button
              onClick={() => {
                setActiveTab("map");
                stopCamera();
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "map" 
                  ? "bg-white text-emerald-700 shadow" 
                  : "hover:bg-emerald-500 text-white"
              }`}
            >
              📍 Locator
            </button>

            {user?.role === "ADMIN" && (
              <button
                onClick={() => {
                  setActiveTab("admin");
                  stopCamera();
                }}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "admin" 
                    ? "bg-white text-emerald-700 shadow" 
                    : "hover:bg-emerald-500 text-white"
                }`}
              >
                ⚙️ Admin
              </button>
            )}

            {/* Auth Dropdown container */}
            <div className="relative ml-2" ref={dropdownRef}>
              {authLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : user ? (
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-inner focus:outline-none"
                >
                  <User className="w-4 h-4" />
                  <span className="max-w-[80px] truncate hidden md:inline">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => { setAuthMode("login"); setShowAuthModal(true); }}
                  className="bg-white hover:bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-lg text-sm font-bold shadow-sm transition"
                >
                  Sign In
                </button>
              )}

              {/* Avatar menu dropdown options */}
              {showUserDropdown && user && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 border border-slate-100 text-slate-700 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-400">LOGGED IN AS</p>
                    <p className="text-sm font-bold truncate text-slate-800">{user.name}</p>
                  </div>
                  
                  <button
                    onClick={() => { setShowProfileModal(true); setShowUserDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 transition"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Profile Settings</span>
                  </button>

                  <button
                    onClick={() => { handleClearAllHistory(); setShowUserDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-rose-600 flex items-center gap-2 transition"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Clear History</span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>
                  
                  <button
                    onClick={() => { handleLogout(); setShowUserDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-800 flex items-center gap-2 transition font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-slate-400" />
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Camera className="text-emerald-600" />
                  Identify Brand Medicine
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  Snap a photo of the tablet strip front/back or upload packaging. Gemini AI extracts the composition and we find cheaper generic options.
                </p>

                {/* Main Capture Area */}
                <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl relative overflow-hidden h-[300px] flex flex-col items-center justify-center">
                  
                  {analyzing ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                      <h3 className="font-bold text-slate-700 text-lg animate-pulse">Analyzing Packaging...</h3>
                      <p className="text-slate-500 text-xs mt-1">Gemini AI is decoding ingredients & generating multilingual explainers</p>
                    </div>
                  ) : useCamera ? (
                    <div className="w-full h-full relative">
                      {/* Video Stream */}
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4 z-10">
                        <button
                          onClick={capturePhoto}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full shadow-lg font-bold flex items-center gap-2 transition"
                        >
                          📸 Capture Photo
                        </button>
                        <button
                          onClick={stopCamera}
                          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-lg font-semibold transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : image ? (
                    <div className="w-full h-full relative">
                      <img 
                        src={image} 
                        alt="Scanned medicine" 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button
                          onClick={() => analyzeMedicine(image)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg shadow-md font-bold transition"
                        >
                          🚀 Start Analysis
                        </button>
                        <button
                          onClick={() => { setImage(null); setError(null); }}
                          className="bg-slate-800 hover:bg-slate-900 text-white p-2.5 rounded-lg shadow-md transition"
                          title="Reset"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="flex flex-col sm:flex-row gap-4 mb-4 w-full sm:w-auto px-4 sm:px-0">
                        <button
                          onClick={startCamera}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-md font-semibold flex items-center justify-center gap-2 transition"
                        >
                          <Camera className="w-5 h-5" />
                          Use Live Camera
                        </button>
                        
                        <label className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl shadow-md font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
                          <Upload className="w-5 h-5" />
                          Upload Packaging Photo
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                          />
                        </label>
                      </div>
                      <p className="text-slate-400 text-xs">Supports image formats (max 5MB). Make sure chemical/salt details are visible.</p>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl mt-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Analysis Failed</p>
                      <p className="text-xs text-rose-700 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* Interactive Demo Shortcuts */}
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Interactive Demo Samples (Test instantly without camera):</p>
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => loadSample("mock_augmentin")}
                      disabled={analyzing}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                    >
                      🧪 Augmentin 625 (Antibiotic)
                    </button>
                    <button
                      onClick={() => loadSample("mock_calpol")}
                      disabled={analyzing}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                    >
                      🧪 Calpol 650 (Fever/Pain)
                    </button>
                    <button
                      onClick={() => loadSample("mock_glycomet")}
                      disabled={analyzing}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition"
                    >
                      🧪 Glycomet GP 1 (Diabetes)
                    </button>
                  </div>
                </div>
              </div>

              {/* Analysis Result Box */}
              {result && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-6">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                    <ShieldCheck className="text-emerald-600" />
                    Analysis Report
                  </h3>

                  {/* Price Comparison Comparison Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Branded Box */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="absolute right-0 top-0 bg-slate-200 text-slate-700 px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg">
                          Branded
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1 mt-2">{result.scannedMedicine.brandName}</h4>
                        <p className="text-slate-500 text-xs mb-3">Manufacturer: {result.scannedMedicine.manufacturer}</p>
                        
                        <div className="mb-4">
                          <span className="text-slate-400 text-xs uppercase font-semibold">Salts / Composition:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {result.scannedMedicine.activeIngredients?.map((item: any, idx: number) => (
                              <span key={idx} className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-xs font-semibold">
                                {item.name} {item.strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-200/60 pt-3 flex items-baseline justify-between">
                        <span className="text-slate-500 text-sm">Estimated Brand Price:</span>
                        <span className="text-xl font-bold text-slate-700">₹{result.genericAlternative?.brandPrice ? result.genericAlternative.brandPrice.toFixed(2) : "120.00"}</span>
                      </div>
                    </div>

                    {/* Generic Box */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="absolute right-0 top-0 bg-emerald-600 text-white px-3 py-1 text-[10px] font-bold uppercase rounded-bl-lg">
                          Generic Alternative
                        </div>
                        
                        {result.genericAlternative ? (
                          <>
                            <h4 className="font-bold text-emerald-900 text-lg leading-tight mb-1 mt-2">
                              {result.genericAlternative.genericName}
                            </h4>
                            <p className="text-emerald-600 text-xs mb-3">Available at Jan Aushadhi Kendras</p>
                            
                            <div className="mb-4">
                              <span className="text-emerald-800/60 text-xs uppercase font-semibold">Capped Generic Formula:</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {result.genericAlternative.salts?.map((salt: string, idx: number) => (
                                  <span key={idx} className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-xs font-semibold">
                                    {salt}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm mt-2">Generic Equivalents Exist</h4>
                            <p className="text-slate-600 text-xs mt-1">
                              No specific Jan Aushadhi match found in local DB. However, look for generic versions matching salts:
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {result.scannedMedicine.activeIngredients?.map((item: any, idx: number) => (
                                <span key={idx} className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded text-xs font-semibold">
                                  {item.name} {item.strength}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {result.genericAlternative ? (
                        <div className="border-t border-emerald-200 pt-3 flex items-baseline justify-between">
                          <span className="text-emerald-800 text-sm font-medium">Jan Aushadhi Price:</span>
                          <span className="text-2xl font-black text-emerald-700">₹{result.genericAlternative.genericPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <p className="text-emerald-700 text-xs font-bold mt-4">Typically saves 60-80% of brand price.</p>
                      )}
                    </div>
                  </div>

                  {/* Savings Banner Card */}
                  {result.genericAlternative && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl p-4 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                          <TrendingDown className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-emerald-100 text-xs font-semibold uppercase tracking-wide">Calculated Savings Margin</p>
                          <p className="text-lg font-bold">
                            Save ₹{(result.genericAlternative.brandPrice - result.genericAlternative.genericPrice).toFixed(2)} per pack
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="bg-white text-emerald-700 font-extrabold px-3 py-1 rounded-lg text-lg shadow-sm">
                          -{Math.round(((result.genericAlternative.brandPrice - result.genericAlternative.genericPrice) / result.genericAlternative.brandPrice) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Multilingual AI Safety Explainer */}
                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4 mb-4">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <Info className="text-emerald-600 w-5 h-5" />
                        Multilingual AI Safety Guide
                      </h4>

                      {/* Language Selection Buttons */}
                      <div className="flex flex-wrap gap-1 bg-slate-200 p-1 rounded-lg">
                        {(["en", "hi", "ta", "te"] as const).map((lang) => (
                          <button
                            key={lang}
                            onClick={() => setSelectedLang(lang)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
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
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border shadow-sm transition-all ${
                              speaking 
                                ? "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100" 
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <Volume2 className={`w-4 h-4 ${speaking ? "animate-pulse" : ""}`} />
                            {speaking ? "Stop Voice Guide" : "Listen Voice Guide (Audio)"}
                          </button>
                        </div>

                        {/* Safety Text Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wide mb-1">📋 Purpose (इस्तेमाल / பயன்பாடு / ఉపయోగం)</h5>
                            <p className="text-slate-700 text-sm leading-relaxed">{result.safetyExplanation[selectedLang].purpose}</p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wide mb-1">⏱ How To Use (खुराक विधि / எப்படி பயன்படுத்த வேண்டும் / ఉపయోగించే విధానం)</h5>
                            <p className="text-slate-700 text-sm leading-relaxed">{result.safetyExplanation[selectedLang].howToUse}</p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <h5 className="font-bold text-xs text-slate-400 uppercase tracking-wide mb-1">🤢 Common Side Effects (दुष्प्रभाव / பக்க விளைவுகள் / దుష్ప్రభావాలు)</h5>
                            <p className="text-slate-700 text-sm leading-relaxed">{result.safetyExplanation[selectedLang].sideEffects}</p>
                          </div>

                          <div className="bg-white p-4 rounded-lg border border-rose-100 bg-rose-50/20">
                            <h5 className="font-bold text-xs text-rose-500 uppercase tracking-wide mb-1">⚠️ Precautions (सावधानियां / எச்சரிக்கைகள் / జాగ్రత్తలు)</h5>
                            <p className="text-slate-700 text-sm leading-relaxed font-medium">{result.safetyExplanation[selectedLang].warnings}</p>
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
                    Jan Aushadhi Kendra Map Locator
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">Explore official government-subsidized pharmacies</p>
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
                stores={userLocation ? sortedStores : filteredStores} 
                center={mapCenter}
                userLocation={userLocation}
              />
              
              {/* Info Disclaimer */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex gap-3 text-xs text-slate-600">
                <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <p>
                  Jan Aushadhi Kendras are initiative stores launched by the **Department of Pharmaceuticals, Govt of India** to supply top-quality medicines at extremely pocket-friendly rates. Prices listed are standard DPCO/Jan Aushadhi catalog caps.
                </p>
              </div>
            </div>
          )}

          {activeTab === "admin" && user?.role === "ADMIN" && (
            /* ADMIN TAB CONSOLE */
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="text-emerald-600" />
                  Admin Dashboard Console
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">Real-time platform statistics and user administration</p>
              </div>

              {adminLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                  <p className="text-slate-500 text-sm">Fetching platform records...</p>
                </div>
              ) : (
                <>
                  {/* Admin Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Registered Users</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{adminStats?.totalUsers || 0}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Scans</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">{adminStats?.totalScans || 0}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Avg. Savings</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">{adminStats?.avgSavingsPercent || 0}%</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl">
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Estimated Saved</p>
                      <p className="text-2xl font-black text-slate-800 mt-1">₹{adminStats?.totalAmountSaved || 0}</p>
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
                          {adminUsers.map((u) => (
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
                              <td className="p-3 text-slate-500">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleUpdateUserRole(u.id, u.role === "ADMIN" ? "USER" : "ADMIN")}
                                  className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                                  title="Toggle User/Admin role"
                                >
                                  Toggle Role
                                </button>
                                <span className="text-slate-300">|</span>
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-rose-600 hover:text-rose-700 font-bold hover:underline"
                                  title="Delete user account"
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
                </>
              )}
            </div>
          )}

          {/* Core medical disclaimer bottom */}
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold">Medical Information Disclaimer</p>
              <p className="mt-0.5 leading-relaxed">
                DawaAI is designed for consumer awareness, pricing comparison, and health literacy only. It **does not** provide medical advice, diagnosis, or treatment. Always consult a certified physician or pharmacist before substituting any medication. Do not stop prescribed treatment without medical consent.
              </p>
            </div>
          </div>
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
                {/* History Search bar */}
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

                {/* History Items Container */}
                {historyLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
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
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 text-center text-xs text-slate-500">
                <Info className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 mb-1">Track Your Savings</p>
                <p className="mb-4">Create a free account to save scan logs, calculate cumulative savings, and view your prescription history.</p>
                <button
                  onClick={() => { setAuthMode("signup"); setShowAuthModal(true); }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
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
            
            <p className="text-slate-500 text-xs">
              Locate where you can purchase these affordable generic drugs. Enable location or choose a city.
            </p>

            <button
              onClick={handleFindMe}
              disabled={locating}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-3 rounded-xl font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
            >
              {locating ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <MapPin className="w-4.5 h-4.5 text-emerald-600" />}
              <span>{userLocation ? "Location Calibrated ✓" : "Detect Current Location"}</span>
            </button>

            {/* List of Nearest Stores */}
            <div className="space-y-3 mt-2 overflow-y-auto max-h-[300px] pr-1">
              {(userLocation ? sortedStores : filteredStores).map((store) => (
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
                      className="text-[10px] text-slate-500 font-medium hover:text-emerald-600 flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3 text-emerald-600" />
                      <span>Call Store</span>
                    </a>
                    
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[10px] font-bold text-emerald-700 px-2 py-1 rounded-md transition"
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

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-500 text-center py-6 border-t border-slate-800 text-xs mt-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 DawaAI - Pradhan Mantri Bhartiya Janaushadhi Pariyojana Awareness Campaign.</p>
          <div className="flex gap-4">
            <a href="https://janaushadhi.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition">Govt Portal</a>
            <span>•</span>
            <a href="#" className="hover:text-emerald-500 transition">Terms of Use</a>
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
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all"
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
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all"
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
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all"
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
                      className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all"
                    />
                  </div>
                )}

                {authError && (
                  <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2 border border-rose-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all"
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
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all"
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
                        className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">New Password</label>
                      <input
                        type="password"
                        value={profileNewPassword}
                        onChange={(e) => setProfileNewPassword(e.target.value)}
                        placeholder="New password (min 6 chars)"
                        className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 bg-slate-50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {profileError && (
                  <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2 border border-rose-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
