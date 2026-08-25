"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { 
  Camera, Upload, ShieldCheck, Pill, Info, MapPin, 
  AlertCircle, Loader2, Volume2, RefreshCw, CheckCircle, 
  TrendingDown, Map, HeartHandshake, PhoneCall
} from "lucide-react";
import { PharmacyStore, storesDatabase } from "@/data/stores";

// Dynamically import Leaflet Map to avoid SSR errors
const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

export default function Home() {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<"scan" | "map">("scan");
  
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

  // City Coordinates for Map Default Centers
  const cityCenters: Record<string, [number, number]> = {
    Delhi: [28.6139, 77.2090],
    Bangalore: [12.9716, 77.5946],
    Mumbai: [19.0760, 72.8777],
    Hyderabad: [17.3850, 78.4867],
    Chennai: [13.0827, 80.2707],
  };

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
      .sort((a, b) => a.distance - b.distance)
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

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle image upload via input file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while analyzing the medicine.");
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
      
      // Attempt to pick a suitable voice for the selected language
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Navbar Banner */}
      <header className="bg-emerald-600 text-white shadow-md py-4 px-6 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white text-emerald-600 p-2 rounded-xl shadow">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">DawaAI</h1>
              <p className="text-emerald-100 text-xs">AI-Powered Generic Medicine savings assistant</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab("scan");
                stopCamera();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "scan" 
                  ? "bg-white text-emerald-700 shadow" 
                  : "hover:bg-emerald-500 text-white"
              }`}
            >
              💊 Medicine Scanner
            </button>
            <button
              onClick={() => {
                setActiveTab("map");
                stopCamera();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "map" 
                  ? "bg-white text-emerald-700 shadow" 
                  : "hover:bg-emerald-500 text-white"
              }`}
            >
              📍 Jan Aushadhi Locator
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT/MAIN PANEL - 2 columns wide on desktop */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {activeTab === "scan" ? (
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
                      <div className="flex gap-4 mb-4">
                        <button
                          onClick={startCamera}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-md font-semibold flex items-center gap-2 transition"
                        >
                          <Camera className="w-5 h-5" />
                          Use Live Camera
                        </button>
                        
                        <label className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl shadow-md font-semibold flex items-center gap-2 cursor-pointer transition">
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
                      <p className="text-slate-400 text-xs">Supports jpeg, png formats. Make sure salts details are legible.</p>
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
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Interactive Demo Samples (Click to test without camera):</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => loadSample("mock_augmentin")}
                      disabled={analyzing}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
                    >
                      🧪 Augmentin 625 (Antibiotic)
                    </button>
                    <button
                      onClick={() => loadSample("mock_calpol")}
                      disabled={analyzing}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
                    >
                      🧪 Calpol 650 (Fever/Pain)
                    </button>
                    <button
                      onClick={() => loadSample("mock_glycomet")}
                      disabled={analyzing}
                      className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition"
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
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute right-0 top-0 bg-slate-200 text-slate-700 px-3 py-1 text-xs font-bold uppercase rounded-bl-lg">
                        Branded
                      </div>
                      <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1">{result.scannedMedicine.brandName}</h4>
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

                      <div className="border-t border-slate-200/60 pt-3 flex items-baseline justify-between">
                        <span className="text-slate-500 text-sm">Estimated Brand Price:</span>
                        <span className="text-xl font-bold text-slate-700">₹{result.genericAlternative?.brandPrice.toFixed(2) || "120.00"}</span>
                      </div>
                    </div>

                    {/* Generic Box */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute right-0 top-0 bg-emerald-600 text-white px-3 py-1 text-xs font-bold uppercase rounded-bl-lg">
                        Generic Alternative
                      </div>
                      
                      {result.genericAlternative ? (
                        <>
                          <h4 className="font-bold text-emerald-900 text-lg leading-tight mb-1">
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

                          <div className="border-t border-emerald-200 pt-3 flex items-baseline justify-between">
                            <span className="text-emerald-800 text-sm font-medium">Jan Aushadhi Price:</span>
                            <span className="text-2xl font-black text-emerald-700">₹{result.genericAlternative.genericPrice.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="h-full flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">Generic Equivalents Exist</h4>
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
                          <p className="text-emerald-700 text-xs font-bold mt-4">Typically saves 60-80% of brand price.</p>
                        </div>
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
          ) : (
            /* MAP DETAIL CONTAINER - Map component only shown in map tab */
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

        {/* RIGHT SIDE PANEL - Store Locations list / Savings stats (1 column wide) */}
        <div className="flex flex-col gap-6">
          
          {/* Geolocation Finder widget */}
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
            <div className="space-y-3 mt-2 overflow-y-auto max-h-[400px] pr-1">
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

          {/* FAQ & Guidelines info block */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <HeartHandshake className="text-emerald-600" />
              Jan Aushadhi FAQ
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div>
                <p className="font-bold text-slate-800">Q: Are generic medicines safe?</p>
                <p className="mt-0.5 text-slate-500">
                  Yes! They contain the exact same active pharmaceutical ingredients (APIs) and have the same therapeutic efficacy as brand-name drugs.
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-800">Q: Why are generic drugs so cheap?</p>
                <p className="mt-0.5 text-slate-500">
                  Generic manufacturers do not spend on drug research, clinical trials, or heavy advertising campaigns, allowing them to sell at base manufacturing margins.
                </p>
              </div>
              <div>
                <p className="font-bold text-slate-800">Q: Can I get generics without prescription?</p>
                <p className="mt-0.5 text-slate-500">
                  No, prescription medicines (Schedule H/H1) still require a valid prescription from a doctor. Jan Aushadhi pharmacists will substitute your brand name for the generic equivalent.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 text-center py-6 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 DawaAI - Pradhan Mantri Bhartiya Janaushadhi Pariyojana Awareness Campaign.</p>
          <div className="flex gap-4">
            <a href="https://janaushadhi.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-500 transition">Govt Portal</a>
            <span>•</span>
            <a href="#" className="hover:text-emerald-500 transition">Terms of Use</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
