import sedan from "@/assets/koryo-sedan-1.jpg";
import suv from "@/assets/koryo-suv-1.jpg";
import coupe from "@/assets/koryo-coupe-1.jpg";
import crossover from "@/assets/koryo-crossover-1.jpg";
import hatch from "@/assets/koryo-hatch-1.jpg";
import truck from "@/assets/koryo-truck-1.jpg";

export type Car = {
  id: string;
  make: string;
  model: { ar: string; en: string };
  year: number;
  km: number;
  fuel: "petrol" | "diesel" | "hybrid" | "electric";
  trans: "auto" | "manual";
  color: { ar: string; en: string };
  engine: string;
  priceKRW: number;
  priceSAR: number;
  image: string;
  status: "stock" | "sourcing";
  featured?: boolean;
  deal?: boolean;
  auction?: boolean;
  badge?: { ar: string; en: string };
};

export const cars: Car[] = [
  {
    id: "hyundai-grandeur-2024",
    make: "Hyundai",
    model: { ar: "هيونداي جرانديور", en: "Hyundai Grandeur" },
    year: 2024,
    km: 8200,
    fuel: "hybrid",
    trans: "auto",
    color: { ar: "أبيض لؤلؤي", en: "Pearl White" },
    engine: "2.5L Hybrid",
    priceKRW: 38000000,
    priceSAR: 109000,
    image: sedan,
    status: "stock",
    featured: true,
    badge: { ar: "وصل حديثاً", en: "New arrival" },
  },
  {
    id: "kia-mohave-2023",
    make: "Kia",
    model: { ar: "كيا موهافي", en: "Kia Mohave" },
    year: 2023,
    km: 22400,
    fuel: "diesel",
    trans: "auto",
    color: { ar: "أسود", en: "Black" },
    engine: "3.0L V6 Diesel",
    priceKRW: 45000000,
    priceSAR: 128000,
    image: suv,
    status: "stock",
    featured: true,
    badge: { ar: "معتمدة", en: "Certified" },
  },
  {
    id: "genesis-g70-2024",
    make: "Genesis",
    model: { ar: "جينيسيس G70 شوتنغ بريك", en: "Genesis G70 Shooting Brake" },
    year: 2024,
    km: 3100,
    fuel: "petrol",
    trans: "auto",
    color: { ar: "فضي", en: "Silver" },
    engine: "2.0T",
    priceKRW: 52000000,
    priceSAR: 148000,
    image: coupe,
    status: "stock",
    featured: true,
    deal: true,
    badge: { ar: "ممشى قليل", en: "Low km" },
  },
  {
    id: "hyundai-kona-2024",
    make: "Hyundai",
    model: { ar: "هيونداي كونا إن", en: "Hyundai Kona N" },
    year: 2024,
    km: 11500,
    fuel: "petrol",
    trans: "auto",
    color: { ar: "أزرق", en: "Blue" },
    engine: "1.6T",
    priceKRW: 31000000,
    priceSAR: 88000,
    image: crossover,
    status: "stock",
    deal: true,
    badge: { ar: "أفضل سعر", en: "Best price" },
  },
  {
    id: "kia-picanto-2023",
    make: "Kia",
    model: { ar: "كيا بيكانتو GT", en: "Kia Picanto GT" },
    year: 2023,
    km: 17200,
    fuel: "petrol",
    trans: "auto",
    color: { ar: "أحمر", en: "Red" },
    engine: "1.0T",
    priceKRW: 17500000,
    priceSAR: 49000,
    image: hatch,
    status: "stock",
    deal: true,
  },
  {
    id: "ssangyong-rexton-2022",
    make: "KGM",
    model: { ar: "كي جي إم ريكستون سبورتس", en: "KGM Rexton Sports" },
    year: 2022,
    km: 38000,
    fuel: "diesel",
    trans: "auto",
    color: { ar: "أبيض", en: "White" },
    engine: "2.2L Diesel",
    priceKRW: 28000000,
    priceSAR: 79000,
    image: truck,
    status: "stock",
    auction: true,
    badge: { ar: "مزاد", en: "Auction" },
  },
  {
    id: "genesis-gv80-2024",
    make: "Genesis",
    model: { ar: "جينيسيس GV80", en: "Genesis GV80" },
    year: 2024,
    km: 6800,
    fuel: "petrol",
    trans: "auto",
    color: { ar: "أسود", en: "Black" },
    engine: "3.5T V6",
    priceKRW: 78000000,
    priceSAR: 219000,
    image: suv,
    status: "sourcing",
    auction: true,
    badge: { ar: "متاحة للاستيراد", en: "Source on demand" },
  },
  {
    id: "kia-k5-2024",
    make: "Kia",
    model: { ar: "كيا K5 GT-Line", en: "Kia K5 GT-Line" },
    year: 2024,
    km: 9400,
    fuel: "petrol",
    trans: "auto",
    color: { ar: "فضي", en: "Silver" },
    engine: "2.5T",
    priceKRW: 33500000,
    priceSAR: 95000,
    image: sedan,
    status: "stock",
    featured: true,
  },
];

export const getCar = (id: string) => cars.find((c) => c.id === id);
