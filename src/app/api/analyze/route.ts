import { NextResponse } from "next/server";
import { findGenericAlternative } from "@/data/generics";

const MOCK_DATA: Record<string, any> = {
  mock_augmentin: {
    scannedMedicine: {
      brandName: "Augmentin 625 Duo",
      activeIngredients: [
        { name: "Amoxicillin", strength: "500mg" },
        { name: "Clavulanic Acid", strength: "125mg" }
      ],
      manufacturer: "GlaxoSmithKline Pharmaceuticals Ltd",
      category: "Antibiotic",
    },
    genericAlternative: {
      brandName: "Augmentin 625 Duo",
      salts: ["Amoxicillin 500mg", "Clavulanic Acid 125mg"],
      genericName: "Amoxicillin and Potassium Clavulanate Tablets IP (625mg)",
      brandPrice: 223.50,
      genericPrice: 60.20,
      quantityText: "10 Tablets",
      category: "Antibiotic"
    },
    safetyExplanation: {
      en: {
        purpose: "Used to treat bacterial infections of the lungs, middle ear, sinuses, skin, and urinary tract.",
        howToUse: "Take this medicine with a meal to reduce stomach upset. Swallow the tablet whole; do not crush or chew.",
        sideEffects: "Nausea, vomiting, diarrhea, skin rash, or yeast infection.",
        warnings: "Do not take if allergic to penicillin. Inform your doctor if you have liver or kidney problems."
      },
      hi: {
        purpose: "यह फेफड़ों, कान, साइनस, त्वचा और मूत्र पथ के जीवाणु (बैक्टीरियल) संक्रमण के इलाज के लिए इस्तेमाल किया जाता है।",
        howToUse: "पेट की खराबी से बचने के लिए इसे भोजन के साथ लें। टैबलेट को पूरा निगलें, इसे तोड़ें या चबाएं नहीं।",
        sideEffects: "उल्टी, दस्त, जी मिचलाना या त्वचा पर चकत्ते (रैश) होना।",
        warnings: "यदि आपको पेनिसिलिन से एलर्जी है तो इसे न लें। किडनी या लीवर की बीमारी होने पर डॉक्टर को सूचित करें।"
      },
      ta: {
        purpose: "நுரையீரல், காது, சைனஸ், தோல் மற்றும் சிறுநீர் பாதையில் ஏற்படும் பாக்டீரியா தொற்றுகளை குணப்படுத்த பயன்படுகிறது.",
        howToUse: "வயிற்று உபாதையை குறைக்க உணவோடு சேர்த்து மாத்திரையை உட்கொள்ளவும். மாத்திரையை முழுமையாக விழுங்கவும்.",
        sideEffects: "வயிற்றுப்போக்கு, குமட்டல், வாந்தி, தோல் தடிப்பு.",
        warnings: "பென்சிலின் ஒவ்வாமை இருந்தால் உட்கொள்ள வேண்டாம். சிறுநீரக அல்லது கல்லீரல் பாதிப்பு இருப்பின் மருத்துவரிடம் கூறவும்."
      },
      te: {
        purpose: "ఊపిరితిత్తులు, చెవి, సైనస్, చర్మం మరియు మూత్రనాళ బ్యాక్టీరియా ఇన్ఫెక్షన్ల నివారణకు వాడతారు.",
        howToUse: "కడుపు నొప్పి రాకుండా ఉండటానికి దీనిని ఆహారంతో పాటు తీసుకోండి. టాబ్లెట్ పూర్తిగా మింగండి.",
        sideEffects: "వికారం, వాంతులు, విరేచనాలు, చర్మంపై దద్దుర్లు.",
        warnings: "పెన్సిలిన్ అలెర్జీ ఉంటే దీనిని వాడకూడదు. కిడ్నీ లేదా లివర్ సమస్యలు ఉంటే డాక్టర్ కి తెలపండి."
      }
    }
  },
  mock_calpol: {
    scannedMedicine: {
      brandName: "Calpol 650",
      activeIngredients: [
        { name: "Paracetamol", strength: "650mg" }
      ],
      manufacturer: "GlaxoSmithKline Pharmaceuticals Ltd",
      category: "Analgesic & Antipyretic",
    },
    genericAlternative: {
      brandName: "Calpol 650",
      salts: ["Paracetamol 650mg"],
      genericName: "Paracetamol Tablets IP 650mg",
      brandPrice: 33.60,
      genericPrice: 10.10,
      quantityText: "15 Tablets",
      category: "Analgesic & Antipyretic"
    },
    safetyExplanation: {
      en: {
        purpose: "Used for relieving mild to moderate pain (headache, toothache, muscle ache) and reducing fever.",
        howToUse: "Take 1 tablet every 4-6 hours as needed. Do not exceed 4 tablets in 24 hours. Take after food.",
        sideEffects: "Very rare side effects if taken in recommended doses. High dose can cause liver damage.",
        warnings: "Avoid drinking alcohol while taking this. Do not take with other Paracetamol-containing medicines."
      },
      hi: {
        purpose: "इसका उपयोग सिरदर्द, दांत दर्द, मांसपेशियों में दर्द को कम करने और बुखार को उतारने के लिए किया जाता है।",
        howToUse: "आवश्यकतानुसार हर 4-6 घंटे में 1 टैबलेट लें। 24 घंटे में 4 टैबलेट से अधिक न लें। भोजन के बाद लें।",
        sideEffects: "नियमित खुराक में दुष्प्रभाव बहुत दुर्लभ हैं। अत्यधिक मात्रा में लेने से लीवर खराब हो सकता है।",
        warnings: "इसे लेते समय शराब के सेवन से बचें। अन्य पेरासिटामोल युक्त दवाओं के साथ न लें।"
      },
      ta: {
        purpose: "லேசான வலி (தலைவலி, பல்வலி) மற்றும் காய்ச்சலை குறைக்க பயன்படுகிறது.",
        howToUse: "தேவைப்பட்டால் 4-6 மணி நேரத்திற்கு ஒருமுறை 1 மாத்திரை எடுக்கவும். 24 மணிநேரத்தில் 4 மாத்திரைகளுக்கு மேல் எடுக்கக் கூடாது.",
        sideEffects: "பரிந்துரைக்கப்பட்ட அளவில் பக்கவிளைவுகள் இல்லை. அதிக அளவு உட்கொண்டால் கல்லீரல் பாதிப்பு ஏற்படும்.",
        warnings: "மது அருந்துவதை தவிர்க்கவும். வேறு பாராசிட்டமால் மருந்துகளுடன் சேர்த்து எடுக்கக் கூடாது."
      },
      te: {
        purpose: "తలనొప్పి, ఒళ్లు నొప్పులు ఉపశమనం మరియు జ్వరం తగ్గించడానికి వాడతారు.",
        howToUse: "అవసరాన్ని బట్టి ప్రతి 4-6 గంటలకు 1 టాబ్లెట్ తీసుకోండి. రోజుకు 4 టాబ్లెట్ల కంటే ఎక్కువ వాడకండి.",
        sideEffects: "తగిన మోతాదులో వాడితే దుష్ప్రభావాలు ఉండవు. అతిగా వాడితే లివర్ దెబ్బతిండుతుంది.",
        warnings: "మద్యపానం చేయవద్దు. ఇతర పారాసిటమాల్ మందులతో కలిపి వాడకూడదు."
      }
    }
  },
  mock_glycomet: {
    scannedMedicine: {
      brandName: "Glycomet GP 1",
      activeIngredients: [
        { name: "Metformin", strength: "500mg" },
        { name: "Glimepiride", strength: "1mg" }
      ],
      manufacturer: "USV Private Limited",
      category: "Antidiabetic",
    },
    genericAlternative: {
      brandName: "Glycomet GP 1",
      salts: ["Metformin 500mg", "Glimepiride 1mg"],
      genericName: "Metformin Hydrochloride and Glimepiride Tablets IP",
      brandPrice: 65.00,
      genericPrice: 15.50,
      quantityText: "15 Tablets",
      category: "Antidiabetic"
    },
    safetyExplanation: {
      en: {
        purpose: "Used to control high blood sugar levels in patients with type 2 diabetes mellitus.",
        howToUse: "Take immediately before or during your first main meal of the day. Take at the same time daily.",
        sideEffects: "Low blood sugar (hypoglycemia), taste changes, nausea, diarrhea, stomach pain.",
        warnings: "Monitor blood sugar regularly. Consult a doctor immediately if you experience breathing difficulties or extreme fatigue."
      },
      hi: {
        purpose: "यह टाइप 2 मधुमेह (डायबिटीज) के रोगियों में रक्त शर्करा (ब्लड शुगर) के स्तर को नियंत्रित करने के लिए उपयोग किया जाता है।",
        howToUse: "दिन के पहले मुख्य भोजन के ठीक पहले या उसके साथ लें। प्रतिदिन एक ही समय पर लें।",
        sideEffects: "रक्त शर्करा का कम होना (हाइपोग्लाइसीमिया), स्वाद बदलना, दस्त, पेट दर्द।",
        warnings: "ब्लड शुगर की नियमित जांच करें। अत्यधिक थकान या सांस लेने में तकलीफ होने पर तुरंत डॉक्टर से संपर्क करें।"
      },
      ta: {
        purpose: "வகை 2 நீரிழிவு நோயாளிகளின் இரத்த சர்க்கரை அளவை கட்டுப்படுத்த பயன்படுகிறது.",
        howToUse: "நாளின் முதல் முக்கிய உணவுக்கு சற்று முன்பாகவோ அல்லது உணவோடோ மாத்திரையை உட்கொள்ளவும்.",
        sideEffects: "இரத்த சர்க்கரை அளவு குறைதல் (ஹைபோகிளைசீமியா), சுவை மாற்றம், வயிற்று வலி.",
        warnings: "சர்க்கரை அளவை தொடர்ந்து கண்காணிக்கவும். மூச்சு திணறல் ஏற்பட்டால் உடனே மருத்துவரை அணுகவும்."
      },
      te: {
        purpose: "టైప్ 2 డయాబెటిస్ రోగులలో రక్తంలో చక్కెర స్థాయిలను నియంత్రించడానికి వాడతారు.",
        howToUse: "రోజులో మొదటి ప్రధాన ఆహారానికి ముందే లేదా ఆహారంతో పాటు తీసుకోండి. ప్రతిరోజూ ఒకే సమయానికి వాడండి.",
        sideEffects: "షుగర్ లెవల్స్ పడిపోవడం, నోటి రుచి మారడం, వికారం, కడుపు నొప్పి.",
        warnings: "క్రమం తప్పకుండా షుగర్ టెస్ట్ చేసుకోండి. శ్వాస తీసుకోవడంలో ఇబ్బంది ఉంటే వెంటనే డాక్టర్ ని సంప్రదించండి."
      }
    }
  }
};

export async function POST(request: Request) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    // Check if the request is for a mock/sample medicine
    if (typeof image === "string" && image.startsWith("mock_")) {
      const mockResult = MOCK_DATA[image];
      if (mockResult) {
        return NextResponse.json(mockResult);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "Gemini API Key is missing. Please configure GEMINI_API_KEY in your env settings to scan real images, or try our Interactive Samples below." 
        }, 
        { status: 500 }
      );
    }

    // Extract base64 content and mime type
    const mimeTypeMatch = image.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,/);
    if (!mimeTypeMatch) {
      return NextResponse.json({ error: "Invalid image format. Must be base64 data URI." }, { status: 400 });
    }

    const mimeType = mimeTypeMatch[1];
    const base64Data = image.replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, "");

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert pharmaceutical assistant. Analyze the uploaded image of a medicine strip, packaging, or bottle. 
              Identify the brand name, active ingredients (chemical composition/salts and their strength e.g. Paracetamol 650mg), the manufacturing company, and the main category of the medicine.
              Provide a clear, simple patient-friendly explanation of the purpose of this medicine, how to take/use it, common side effects, and important precautions (warnings).
              Explain this safety information in English, Hindi (हिंदी), Tamil (தமிழ்), and Telugu (తెలుగు) in simple, easy-to-understand words that a common citizen can comprehend.`
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            brandName: { type: "STRING", description: "The brand name printed on the packaging" },
            activeIngredients: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING", description: "Active chemical/salt name (e.g. Amoxicillin)" },
                  strength: { type: "STRING", description: "Strength or dosage quantity (e.g. 500mg)" }
                },
                required: ["name", "strength"]
              },
              description: "All active ingredients/salts and their corresponding strengths"
            },
            manufacturer: { type: "STRING", description: "The manufacturing pharmaceutical company" },
            inferredCategory: { type: "STRING", description: "A simple classification, e.g. Antibiotic, Antacid, Painkiller, Antidiabetic, Antihypertensive" },
            safetyExplanation: {
              type: "OBJECT",
              properties: {
                en: {
                  type: "OBJECT",
                  properties: {
                    purpose: { type: "STRING", description: "What this medicine is used for in plain English" },
                    howToUse: { type: "STRING", description: "Standard dosage directions and timing in plain English" },
                    sideEffects: { type: "STRING", description: "Common side effects in plain English" },
                    warnings: { type: "STRING", description: "Critical warnings and precautions in plain English" }
                  },
                  required: ["purpose", "howToUse", "sideEffects", "warnings"]
                },
                hi: {
                  type: "OBJECT",
                  properties: {
                    purpose: { type: "STRING", description: "What this medicine is used for in plain Hindi (हिंदी)" },
                    howToUse: { type: "STRING", description: "Standard dosage directions and timing in plain Hindi (हिंदी)" },
                    sideEffects: { type: "STRING", description: "Common side effects in plain Hindi (हिंदी)" },
                    warnings: { type: "STRING", description: "Critical warnings and precautions in plain Hindi (हिंदी)" }
                  },
                  required: ["purpose", "howToUse", "sideEffects", "warnings"]
                },
                ta: {
                  type: "OBJECT",
                  properties: {
                    purpose: { type: "STRING", description: "What this medicine is used for in plain Tamil (தமிழ்)" },
                    howToUse: { type: "STRING", description: "Standard dosage directions and timing in plain Tamil (தமிழ்)" },
                    sideEffects: { type: "STRING", description: "Common side effects in plain Tamil (தமிழ்)" },
                    warnings: { type: "STRING", description: "Critical warnings and precautions in plain Tamil (தமிழ்)" }
                  },
                  required: ["purpose", "howToUse", "sideEffects", "warnings"]
                },
                te: {
                  type: "OBJECT",
                  properties: {
                    purpose: { type: "STRING", description: "What this medicine is used for in plain Telugu (తెలుగు)" },
                    howToUse: { type: "STRING", description: "Standard dosage directions and timing in plain Telugu (తెలుగు)" },
                    sideEffects: { type: "STRING", description: "Common side effects in plain Telugu (తెలుగు)" },
                    warnings: { type: "STRING", description: "Critical warnings and precautions in plain Telugu (తెలుగు)" }
                  },
                  required: ["purpose", "howToUse", "sideEffects", "warnings"]
                }
              },
              required: ["en", "hi", "ta", "te"]
            }
          },
          required: ["brandName", "activeIngredients", "manufacturer", "inferredCategory", "safetyExplanation"]
        }
      }
    };

    // Call gemini-2.5-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiPayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Gemini API error: ${errorText}` }, { status: response.status });
    }

    const resData = await response.json();
    const generatedText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json({ error: "Failed to extract text from Gemini response" }, { status: 500 });
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(generatedText.trim());
    } catch (e) {
      return NextResponse.json({ 
        error: "Failed to parse Gemini output as JSON.", 
        rawText: generatedText 
      }, { status: 500 });
    }

    const brandName = parsedResult.brandName || "";
    const saltsStr = parsedResult.activeIngredients?.map((s: any) => `${s.name} ${s.strength}`).join(" + ") || "";
    
    let matchedGeneric = findGenericAlternative(brandName);
    if (!matchedGeneric && saltsStr) {
      matchedGeneric = findGenericAlternative(saltsStr);
    }

    return NextResponse.json({
      scannedMedicine: {
        brandName: parsedResult.brandName,
        activeIngredients: parsedResult.activeIngredients,
        manufacturer: parsedResult.manufacturer,
        category: parsedResult.inferredCategory,
      },
      genericAlternative: matchedGeneric,
      safetyExplanation: parsedResult.safetyExplanation
    });

  } catch (error: any) {
    console.error("Analysis route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
