export interface GenericMedicine {
  brandName: string;
  salts: string[];
  genericName: string;
  brandPrice: number; // in INR
  genericPrice: number; // in INR
  quantityText: string; // e.g., "10 Tablets", "15 Capsules"
  category: string;
}

export const genericsDatabase: GenericMedicine[] = [
  {
    brandName: "Augmentin 625 Duo",
    salts: ["Amoxicillin 500mg", "Clavulanic Acid 125mg"],
    genericName: "Amoxicillin and Potassium Clavulanate Tablets IP (625mg)",
    brandPrice: 223.50,
    genericPrice: 60.20,
    quantityText: "10 Tablets",
    category: "Antibiotic"
  },
  {
    brandName: "Clavam 625",
    salts: ["Amoxicillin 500mg", "Clavulanic Acid 125mg"],
    genericName: "Amoxicillin and Potassium Clavulanate Tablets IP (625mg)",
    brandPrice: 223.50,
    genericPrice: 60.20,
    quantityText: "10 Tablets",
    category: "Antibiotic"
  },
  {
    brandName: "Glycomet GP 1",
    salts: ["Metformin 500mg", "Glimepiride 1mg"],
    genericName: "Metformin Hydrochloride and Glimepiride Tablets IP",
    brandPrice: 65.00,
    genericPrice: 15.50,
    quantityText: "15 Tablets",
    category: "Antidiabetic"
  },
  {
    brandName: "Glycomet GP 2",
    salts: ["Metformin 500mg", "Glimepiride 2mg"],
    genericName: "Metformin Hydrochloride and Glimepiride Tablets IP (GP 2)",
    brandPrice: 85.00,
    genericPrice: 19.80,
    quantityText: "15 Tablets",
    category: "Antidiabetic"
  },
  {
    brandName: "Calpol 650",
    salts: ["Paracetamol 650mg"],
    genericName: "Paracetamol Tablets IP 650mg",
    brandPrice: 33.60,
    genericPrice: 10.10,
    quantityText: "15 Tablets",
    category: "Analgesic & Antipyretic"
  },
  {
    brandName: "Crocin 650",
    salts: ["Paracetamol 650mg"],
    genericName: "Paracetamol Tablets IP 650mg",
    brandPrice: 33.60,
    genericPrice: 10.10,
    quantityText: "15 Tablets",
    category: "Analgesic & Antipyretic"
  },
  {
    brandName: "Pan-D",
    salts: ["Pantoprazole 40mg", "Domperidone 30mg"],
    genericName: "Pantoprazole Sodium and Domperidone SR Capsules",
    brandPrice: 199.00,
    genericPrice: 35.00,
    quantityText: "15 Capsules",
    category: "Antacid & Anti-reflux"
  },
  {
    brandName: "Pan-40",
    salts: ["Pantoprazole 40mg"],
    genericName: "Pantoprazole Sodium Gastro-resistant Tablets IP 40mg",
    brandPrice: 165.00,
    genericPrice: 22.00,
    quantityText: "15 Tablets",
    category: "Antacid"
  },
  {
    brandName: "Lipvas 10",
    salts: ["Atorvastatin 10mg"],
    genericName: "Atorvastatin Tablets IP 10mg",
    brandPrice: 95.00,
    genericPrice: 18.00,
    quantityText: "15 Tablets",
    category: "Cholesterol Lowering"
  },
  {
    brandName: "Atorva 10",
    salts: ["Atorvastatin 10mg"],
    genericName: "Atorvastatin Tablets IP 10mg",
    brandPrice: 95.00,
    genericPrice: 18.00,
    quantityText: "15 Tablets",
    category: "Cholesterol Lowering"
  },
  {
    brandName: "Telma 40",
    salts: ["Telmisartan 40mg"],
    genericName: "Telmisartan Tablets IP 40mg",
    brandPrice: 100.00,
    genericPrice: 15.00,
    quantityText: "15 Tablets",
    category: "Blood Pressure"
  },
  {
    brandName: "Montek LC",
    salts: ["Montelukast 10mg", "Levocetirizine 5mg"],
    genericName: "Montelukast Sodium and Levocetirizine Hydrochloride Tablets",
    brandPrice: 215.00,
    genericPrice: 45.00,
    quantityText: "10 Tablets",
    category: "Antiallergic"
  },
  {
    brandName: "Omez 20",
    salts: ["Omeprazole 20mg"],
    genericName: "Omeprazole Capsules IP 20mg",
    brandPrice: 60.00,
    genericPrice: 12.00,
    quantityText: "20 Capsules",
    category: "Antacid"
  },
  {
    brandName: "Amlokind 5",
    salts: ["Amlodipine 5mg"],
    genericName: "Amlodipine Tablets IP 5mg",
    brandPrice: 35.00,
    genericPrice: 6.00,
    quantityText: "15 Tablets",
    category: "Blood Pressure"
  },
  {
    brandName: "Zifi 200",
    salts: ["Cefixime 200mg"],
    genericName: "Cefixime Tablets IP 200mg",
    brandPrice: 110.00,
    genericPrice: 30.00,
    quantityText: "10 Tablets",
    category: "Antibiotic"
  },
  {
    brandName: "Janumet 50/500",
    salts: ["Sitagliptin 50mg", "Metformin 500mg"],
    genericName: "Sitagliptin and Metformin Hydrochloride Tablets IP",
    brandPrice: 340.00,
    genericPrice: 80.00,
    quantityText: "15 Tablets",
    category: "Antidiabetic"
  }
];

export function findGenericAlternative(brandOrSalts: string): GenericMedicine | null {
  const normalized = brandOrSalts.toLowerCase();
  
  // Try to match brand name
  const brandMatch = genericsDatabase.find(
    item => normalized.includes(item.brandName.toLowerCase()) || 
            item.brandName.toLowerCase().includes(normalized)
  );
  if (brandMatch) return brandMatch;

  // Try to match salts
  const saltMatch = genericsDatabase.find(item => {
    return item.salts.some(salt => {
      const saltName = salt.split(" ")[0].toLowerCase(); // e.g., "paracetamol" from "Paracetamol 650mg"
      return normalized.includes(saltName);
    });
  });
  
  return saltMatch || null;
}
