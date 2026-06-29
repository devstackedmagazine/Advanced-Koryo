// Complete list of brands present in the Rinevo/Encar inventory (scanned across all pages).
// `value` is the exact API brand string (sent as the `brand` filter),
// `label` is the friendly display name,
// `slug` is the simpleicons logo slug ("" = no logo available → render text only).
// Ordered by inventory volume (most cars first). Korean-script duplicates
// (쉐보레(GM대우), 기아) and the non-brand "Others" are intentionally excluded.

export type Brand = { value: string; label: string; slug: string };

export const BRANDS: Brand[] = [
  { value: "Hyundai", label: "Hyundai", slug: "hyundai" },
  { value: "Kia", label: "Kia", slug: "kia" },
  { value: "ChevroletGMDaewoo", label: "Chevrolet", slug: "chevrolet" },
  { value: "KG_Mobility_Ssangyong", label: "SsangYong (KGM)", slug: "" },
  { value: "BMW", label: "BMW", slug: "bmw" },
  { value: "Mercedes-Benz", label: "Mercedes-Benz", slug: "" },
  { value: "Renault-KoreaSamsung", label: "Renault", slug: "renault" },
  { value: "Volkswagen", label: "Volkswagen", slug: "volkswagen" },
  { value: "Audi", label: "Audi", slug: "audi" },
  { value: "Mini", label: "MINI", slug: "mini" },
  { value: "Land Rover", label: "Land Rover", slug: "" },
  { value: "Porsche", label: "Porsche", slug: "porsche" },
  { value: "Ford", label: "Ford", slug: "ford" },
  { value: "Fiat", label: "Fiat", slug: "fiat" },
  { value: "Honda", label: "Honda", slug: "honda" },
  { value: "Jeep", label: "Jeep", slug: "jeep" },
  { value: "Nissan", label: "Nissan", slug: "nissan" },
  { value: "Jaguar", label: "Jaguar", slug: "" },
  { value: "Lexus", label: "Lexus", slug: "" },
  { value: "Infiniti", label: "Infiniti", slug: "infiniti" },
  { value: "Volvo", label: "Volvo", slug: "volvo" },
  { value: "Maserati", label: "Maserati", slug: "maserati" },
  { value: "Bentley", label: "Bentley", slug: "bentley" },
  { value: "Peugeot", label: "Peugeot", slug: "peugeot" },
  { value: "Citroen-DS", label: "Citroën / DS", slug: "citroen" },
  { value: "Toyota", label: "Toyota", slug: "toyota" },
  { value: "Lincoln", label: "Lincoln", slug: "" },
  { value: "Chrysler", label: "Chrysler", slug: "chrysler" },
  { value: "Cadillac", label: "Cadillac", slug: "cadillac" },
  { value: "Suzuki", label: "Suzuki", slug: "suzuki" },
  { value: "Smart", label: "Smart", slug: "smart" },
  { value: "Rolls-Royce", label: "Rolls-Royce", slug: "rollsroyce" },
  { value: "Daihatsu", label: "Daihatsu", slug: "" },
  { value: "Dodge", label: "Dodge", slug: "" },
  { value: "Subaru", label: "Subaru", slug: "subaru" },
  { value: "Mitsuoka", label: "Mitsuoka", slug: "" },
];

export const brandLogoUrl = (slug: string) =>
  slug ? `https://cdn.simpleicons.org/${slug}/0a0a0a` : null;

// Models available per brand (exact API `model` values), scanned from the full
// inventory and ordered by volume. The strings are sent verbatim as the `model`
// filter — note a few carry trailing spaces (e.g. "SM5 ") exactly as the API returns them.
export const BRAND_MODELS: Record<string, string[]> = {
  Hyundai: ["Grandeur", "AVANTE", "Santafe", "Genesis", "Sonata", "Starex", "Tucson", "Equus", "Accent", "Maxcruz", "i40", "i30", "Veloster", "Veracruz"],
  Kia: ["morning", "K3", "Sportage", "K5", "RAY", "K7", "Sorento", "Mohave", "Canival", "pride", "K9", "Carens", "Soul", "Porte"],
  ChevroletGMDaewoo: ["Spark", "Orlando", "Cruze", "Malibu", "Captiva", "Trax", "Alpheon", "Aveo", "labo", "damas"],
  KG_Mobility_Ssangyong: ["KORANDO", "Rexton", "Chairman"],
  BMW: ["5-Series", "3-Series", "Gran Turismo", "7-Series", "1-Series", "X3", "X5", "4-Series", "X6", "X1", "6-Series", "M6", "Z4", "M3"],
  "Mercedes-Benz": ["E-Class", "S-Class", "C-Class", "GLK-Class", "A-Class", "CLA-Class", "CLS-Class", "B-Class", "Sprinter", "M-class", "SLK-Class", "G-Class", "SL-Class", "SLS AMG", "GL-Class"],
  "Renault-KoreaSamsung": ["SM5 ", "SM3", "QM5 ", "QM3", "SM7"],
  Volkswagen: ["Golf", "CC", "Beatle", "Tiguan", "Passat", "Scirocco", "Jetta", "Polo", "Touareg", "Phaeton"],
  Audi: ["A6", "A7", "A4", "A8", "Q3", "A5", "Q5", "Q7", "A3", "SQ5", "S8", "S7", "RS5", "A1", "TT", "R8", "RS7"],
  Mini: ["Cooper", "Countryman", "Paceman", "Cooper Convertible", "Roadster", "Coupe", "Clubman"],
  "Land Rover": ["Discovery", "Range Rover Sport", "Range Rover", "Range Rover Evoque", "Freelander"],
  Porsche: ["Cayenne", "911", "Panamera", "Boxster"],
  Ford: ["Explorer", "Taurus", "F150", "Fusion", "Focus", "Escape"],
  Fiat: ["500", "Feelmont"],
  Honda: ["Accord", "Odyssey", "Crosstour", "CR-V", "Civic", "N-ONE"],
  Jeep: ["Cherokee", "Wrangler", "Compass"],
  Nissan: ["Altima", "Juke", "Cube", "GT-R", "Teana", "Pathfinder"],
  Jaguar: ["XF", "XJ", "F-TYPE"],
  Lexus: ["ES", "LS", "IS", "CT200h"],
  Infiniti: ["Q50", "G", "M", "JX", "QX70"],
  Volvo: ["S60", "XC70", "XC60", "V40", "S80"],
  Maserati: ["Ghibli", "Quattroporte", "GranTurismo"],
  Bentley: ["Continental", "Flying Spur", "Mulsanne"],
  Peugeot: ["3008", "508", "308", "Expert"],
  "Citroen-DS": ["DS3", "DS4", "DS5"],
  Toyota: ["Camry", "Sienna", "86", "Venza", "Prius", "FJ Cruiser"],
  Lincoln: ["MKS", "MKZ", "MKX"],
  Chrysler: ["300C", "Grand Voyager"],
  Cadillac: ["Escalade", "ATS"],
  Suzuki: ["Alto Lapin"],
  Smart: ["Fortwo"],
  "Rolls-Royce": ["Ghost"],
  Daihatsu: ["Mira"],
  Dodge: ["Grand Caravan"],
  Subaru: ["Impreza"],
  Mitsuoka: ["Galue"],
};
