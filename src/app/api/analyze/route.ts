import { NextResponse } from "next/server";
import { genericsDatabase, findGenericAlternative } from "@/data/generics";

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
        warnings: "పెన్సిలిన్ అలెర్జీ ఉంటే దీనిని వాడకూడదు. కిడ్నీ లేదా లివర్ समस्या ఉంటే డాక్టర్ కి తెలపండి."
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
        warnings: "इसे लेते समय शराब के सेवन से बचें। अन्य पेरासิตामोल युक्त दवाओं के साथ न लें।"
      },
      ta: {
        purpose: "மிதமான மற்றும் கடுமையான காய்ச்சல் மற்றும் உடல் வலி குறைக்க பயன்படுகிறது.",
        howToUse: "உணவுக்கு பின் உட்கொள்ளவும். ஒரு நாளைக்கு 4 மாத்திரைகளுக்கு மேல் உட்கொள்ளக் கூடாது.",
        sideEffects: "பரிந்துரைக்கப்பட்ட அளவில் பக்கவிளைவுகள் அரிது. அதிக அளவு கல்லீரல் பாதிப்பை ஏற்படுத்தும்.",
        warnings: "இந்த மருந்தை உட்கொள்ளும் போது மது அருந்துவதை தவிர்க்கவும். பிற பாராசிட்டமால் மும்மடி தவிர்க்கவும்."
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

// Generates simulated safety sheets for any generics in the databases
function generateGenericSafetyExplanation(medicine: any) {
  const name = medicine.brandName;
  const category = medicine.category || "therapeutic";
  
  return {
    en: {
      purpose: `Used to treat and manage ${category.toLowerCase()} conditions as prescribed by doctors.`,
      howToUse: `Take this medicine in the dose and duration advised by your physician. Swallow it as a whole with water.`,
      sideEffects: `Common side effects include mild nausea, headaches, dizziness, or temporary stomach upset.`,
      warnings: `Keep out of reach of children. Consult your doctor if you are pregnant, nursing, or have organ impairments.`
    },
    hi: {
      purpose: `यह डॉक्टर द्वारा निर्धारित ${category} स्थितियों के उपचार और प्रबंधन के लिए उपयोग किया जाता है।`,
      howToUse: `इस दवा को अपने चिकित्सक द्वारा बताई गई खुराक और अवधि में लें। इसे पानी के साथ पूरा निगल लें।`,
      sideEffects: `आम दुष्प्रभावों में हल्की मतली, सिरदर्द, चक्कर आना या अस्थायी पेट खराब होना शामिल हैं।`,
      warnings: `बच्चों की पहुंच से दूर रखें। यदि आप गर्भवती हैं, स्तनपान करा रही हैं, या किडनी/लिवर की समस्या है तो डॉक्टर से सलाह लें।`
    },
    ta: {
      purpose: `மருத்துவர்களால் பரிந்துரைக்கப்படும் ${category} நிலைமைகளுக்கு சிகிச்சையளிக்கப் பயன்படுகிறது.`,
      howToUse: `இந்த மருந்தை உங்கள் மருத்துவர் அறிவுறுத்திய அளவு மற்றும் காலத்திற்கு எடுத்துக்கொள்ளுங்கள்.`,
      sideEffects: `பொதுவான பக்கவிளைவுகளில் லேசான குமட்டல், தலைவலி, மயக்கம் அல்லது தற்காலிக வயிற்று உபாதை இருக்கும்.`,
      warnings: `குழந்தைகளுக்கு எட்டாதவாறு வைக்கவும். கர்ப்பமாக இருந்தால் அல்லது ஏதேனும் உடல் பாதிப்புகள் இருப்பின் மருத்துவரை அணுகவும்.`
    },
    te: {
      purpose: `వైద్యులు సూచించిన విధంగా ${category} పరిస్థితుల చికిత్సకు ఉపయోగించబడుతుంది.`,
      howToUse: `ఈ మందును మీ వైద్యుడు సూచించిన మోతాదు మరియు వ్యవధిలో తీసుకోండి. దీనిని నీటితో పూర్తిగా మింగండి.`,
      sideEffects: `సాధారణ దుష్ప్రభావాలలో తేలికపాటి వికారం, తలనొప్పి, మైకము లేదా తాత్కాలిక కడుపు నొప్పి ఉంటాయి.`,
      warnings: `పిల్లలకు దూరంగా ఉంచండి. గర్భిణీలు లేదా కిడ్నీ/కాలేయ వ్యాధులు ఉన్నవారు డాక్టర్ ని సంప్రదించాలి.`
    }
  };
}

export async function POST(request: Request) {
  try {
    const { image, text, filename } = await request.json();

    // Simulate standard AI API latency (1.2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Case 1: Text Search Query
    if (text && typeof text === "string" && text.trim().length > 0) {
      const normalized = text.toLowerCase().trim();

      // Check if it matches one of our three core mock entries
      if (normalized.includes("augmentin") || normalized.includes("amoxicillin") || normalized.includes("clavulan")) {
        return NextResponse.json(MOCK_DATA.mock_augmentin);
      }
      if (normalized.includes("calpol") || normalized.includes("crocin") || normalized.includes("paracetamol")) {
        return NextResponse.json(MOCK_DATA.mock_calpol);
      }
      if (normalized.includes("glycomet") || normalized.includes("metformin")) {
        return NextResponse.json(MOCK_DATA.mock_glycomet);
      }

      // Fallback: search in generics database
      const match = findGenericAlternative(normalized);
      if (match) {
        const ingredients = match.salts.map(s => {
          const parts = s.split(" ");
          return { name: parts[0], strength: parts[1] || "" };
        });

        const customPayload = {
          scannedMedicine: {
            brandName: match.brandName,
            activeIngredients: ingredients,
            manufacturer: "Generic Alternate India",
            category: match.category,
          },
          genericAlternative: {
            brandName: match.brandName,
            salts: match.salts,
            genericName: match.genericName,
            brandPrice: match.brandPrice,
            genericPrice: match.genericPrice,
            quantityText: match.quantityText,
            category: match.category
          },
          safetyExplanation: generateGenericSafetyExplanation(match)
        };
        return NextResponse.json(customPayload);
      }

      // No match found
      return NextResponse.json(
        { error: `Could not find a generic alternative for "${text}". Try searching for Calpol, Augmentin, Glycomet, Crocin, Zifi, Telma or Pan-40.` }, 
        { status: 404 }
      );
    }

    // Case 2: Image Data Upload
    if (!image) {
      return NextResponse.json({ error: "Image data or text query is required" }, { status: 400 });
    }

    let targetKey = "";

    // Check if the base64 content specifies a mock template directly
    if (typeof image === "string" && image.startsWith("mock_")) {
      targetKey = image;
    } else if (filename && typeof filename === "string") {
      const normalizedFn = filename.toLowerCase();

      // Check if filename contains references to our primary templates
      if (normalizedFn.includes("augmentin") || normalizedFn.includes("amoxicillin") || normalizedFn.includes("clavulan")) {
        targetKey = "mock_augmentin";
      } else if (normalizedFn.includes("calpol") || normalizedFn.includes("crocin") || normalizedFn.includes("paracetamol")) {
        targetKey = "mock_calpol";
      } else if (normalizedFn.includes("glycomet") || normalizedFn.includes("metformin")) {
        targetKey = "mock_glycomet";
      } else {
        // Look up file name parts inside the generic database
        for (const med of genericsDatabase) {
          const namePart = med.brandName.toLowerCase().split(" ")[0];
          if (normalizedFn.includes(namePart)) {
            const ingredients = med.salts.map(s => {
              const parts = s.split(" ");
              return { name: parts[0], strength: parts[1] || "" };
            });

            return NextResponse.json({
              scannedMedicine: {
                brandName: med.brandName,
                activeIngredients: ingredients,
                manufacturer: "Generic Alternate India",
                category: med.category,
              },
              genericAlternative: {
                brandName: med.brandName,
                salts: med.salts,
                genericName: med.genericName,
                brandPrice: med.brandPrice,
                genericPrice: med.genericPrice,
                quantityText: med.quantityText,
                category: med.category
              },
              safetyExplanation: generateGenericSafetyExplanation(med),
              isSimulatedScan: true
            });
          }
        }
      }
    }

    // Default fallback if no filename match is found
    if (!targetKey) {
      // Pick a random template but mark that it was simulated
      const keys = ["mock_augmentin", "mock_calpol", "mock_glycomet"];
      targetKey = keys[Math.floor(Math.random() * keys.length)];
    }

    const mockResult = MOCK_DATA[targetKey];
    if (!mockResult) {
      return NextResponse.json({ error: "Medicine data not found" }, { status: 404 });
    }

    // Return mock data, flagging it as simulated if it wasn't a direct mock selection
    return NextResponse.json({
      ...mockResult,
      isSimulatedScan: !image.startsWith("mock_")
    });

  } catch (error: any) {
    console.error("Analysis mock route error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
