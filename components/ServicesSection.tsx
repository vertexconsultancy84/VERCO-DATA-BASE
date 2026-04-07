import { MessageSquare, Send } from "lucide-react";
import Link from "next/link";

const services = [
  {
    id: 1,
    title: "Management Consultancy",
    description:
      "Strategic business consulting services to optimize your operations and drive sustainable growth.",
    image: "/images/service1.jpg?height=300&width=400",
    date: "24/7",
    comments: "Available",
  },
  {
    id: 2,
    title: "Business Strategy Development",
    description:
      "Comprehensive strategic planning and business development services for long-term success.",
    image: "/images/service1.jpg?height=300&width=400",
    date: "Strategic",
    comments: "Planning",
  },
  {
    id: 3,
    title: "Customer Management",
    description:
      "Customer acquisition, Customer data management, customer retention royalty, custmer relationship building and customer performance Management.",
    image: "/images/service2.jpg?height=300&width=400",
    date: "Quality",
    comments: "Assured",
  },

  {
    id: 4,
    title: "Fertilizers & Nitrogen Compounds",
    description:
      "Specialized consulting for fertilizer production and nitrogen compound manufacturing.",
    image: "/images/service7.jpg?height=300&width=400",
    date: "Agro",
    comments: "Solutions",
  },
  {
    id: 5,
    title: "Pesticides & Agrochemicals",
    description:
      "Expert guidance in pesticide and agrochemical product development and manufacturing.",
    image: "/images/service8.jpg?height=300&width=400",
    date: "Safe",
    comments: "Products",
  },
  {
    id: 6,
    title: "Paints & Coatings",
    description:
      "Consulting services for paint, varnish, and coating manufacturing processes.",
    image: "/images/service5.jpg?height=300&width=400",
    date: "Quality",
    comments: "Coatings",
  },
  {
    id: 7,
    title: "Soap & Detergents",
    description:
      "Professional consulting for soap, detergent, and cleaning product manufacturing.",
    image: "/images/service6.jpg?height=300&width=400",
    date: "Clean",
    comments: "Solutions",
  },
  {
    id: 8,
    title: "Global Trading Services",
    description:
      "International trade consulting and global market entry strategies for businesses.",
    image: "/images/global-trade.jpg?height=300&width=400",
    date: "Global",
    comments: "Reach",
  },
  {
    id: 9,
    title: "Wholesale Trade",
    description:
      "Non-specialized wholesale trade consulting and distribution network optimization.",
    image: "/images/wholesale.jpg?height=300&width=400",
    date: "Trade",
    comments: "Networks",
  },
  {
    id: 10,
    title: "Airtime Service Retail",
    description:
      "Retail service consulting for airtime and telecommunications service distribution.",
    image: "/images/airtime.jpg?height=300&width=400",
    date: "Telecom",
    comments: "Services",
  },
  {
    id: 11,
    title: "Cargo Handling",
    description:
      "Professional logistics and cargo handling consulting for efficient operations.",
    image: "/images/corgo.jpg?height=300&width=400",
    date: "Logistics",
    comments: "Solutions",
  },
  {
    id: 12,
    title: "Technical Testing & Analysis",
    description:
      "Comprehensive technical testing and analysis services for quality assurance.",
    image: "/images/technical-testing.jpg?height=300&width=400",
    date: "Quality",
    comments: "Testing",
  },
  {
    id: 13,
    title: "Tax consultation, Product, Pricing Strategy",
    description:
      "Tax advisory, product maketing, and pricing strategy with industries",
    image: "/images/service3.jpg?height=300&width=400",
    date: "Quality",
    comments: "Testing",
  },
    {
    id: 14,
    title: "Chemical Manufacturing",
    description:
      "Professional consulting for basic chemicals manufacturing and production optimization.",
    image: "/images/service6.jpg?height=300&width=400",
    date: "Quality",
    comments: "Assured",
  },
  {
    id: 15,
    title: "Food Delivery",
    description:
      "Professional food delivery services connecting restaurants with customers for convenient meal delivery.",
    image: "/images/food-delivery.jpg?height=300&width=400",
    date: "24/7",
    comments: "Delivery",
  },
  {
    id: 16,
    title: "House & Apartment Rentals",
    description:
      "Comprehensive rental services for houses, apartments, and residential properties with flexible terms.",
    image: "/images/real-estate.jpg?height=300&width=400",
    date: "Homes",
    comments: "Available",
  },
  {
    id: 17,
    title: "Real Estate Services",
    description:
      "Professional real estate consulting, property management, and investment advisory services.",
    image: "/images/real-estate.jpg?height=300&width=400",
    date: "Property",
    comments: "Expert",
  },
  {
    id: 18,
    title: "Property Management",
    description:
      "Complete property management services for residential and commercial properties.",
    image: "/images/service4.jpg?height=300&width=400",
    date: "Managed",
    comments: "Care",
  },
  {
    id: 19,
    title: "Construction Services",
    description:
      "Professional construction consulting and project management for residential and commercial projects.",
    image: "/images/service5.jpg?height=300&width=400",
    date: "Build",
    comments: "Quality",
  },
  {
    id: 20,
    title: "Interior Design",
    description:
      "Creative interior design services for homes, offices, and commercial spaces.",
    image: "/images/interio-design.jpg?height=300&width=400",
    date: "Design",
    comments: "Creative",
  },
  {
    id: 21,
    title: "Cleaning Services",
    description:
      "Professional cleaning services for residential, commercial, and industrial properties.",
    image: "/images/cleaning.jpg?height=300&width=400",
    date: "Clean",
    comments: "Professional",
  },
  {
    id: 22,
    title: "Security Services",
    description:
      "Comprehensive security solutions for residential, commercial, and industrial properties.",
    image: "/images/security-service.jpg?height=300&width=400",
    date: "Secure",
    comments: "Protected",
  },
  {
    id: 23,
    title: "Transportation Services",
    description:
      "Reliable transportation and logistics services for goods and passengers.",
    image: "/images/transportation.jpg?height=300&width=400",
    date: "Transit",
    comments: "Reliable",
  },
  {
    id: 24,
    title: "Event Planning",
    description:
      "Professional event planning and management services for corporate and private events.",
    image: "/images/event.jpg?height=300&width=400",
    date: "Events",
    comments: "Managed",
  },
  {
    id: 25,
    title: "Photography & Videography",
    description:
      "Professional photography and videography services for events, products, and marketing.",
    image: "/images/photography.jpg?height=300&width=400",
    date: "Visual",
    comments: "Creative",
  },
  {
    id: 26,
    title: "Web Development",
    description:
      "Custom web development and digital solutions for businesses of all sizes.",
    image: "/images/web-development.jpg?height=300&width=400",
    date: "Digital",
    comments: "Solutions",
  },
  {
    id: 27,
    title: "Digital Marketing",
    description:
      "Comprehensive digital marketing strategies to grow your online presence.",
    image: "/images/digital-marketing.jpg?height=300&width=400",
    date: "Marketing",
    comments: "Growth",
  },
  {
    id: 28,
    title: "IT Support Services",
    description:
      "Professional IT support and technical services for businesses and individuals.",
    image: "/images/IT-suport.jpg?height=300&width=400",
    date: "Tech",
    comments: "Support",
  },
  {
    id: 29,
    title: "Legal Services",
    description:
      "Professional legal consulting and advisory services for businesses and individuals.",
    image: "/images/legal.jpg?height=300&width=400",
    date: "Legal",
    comments: "Expert",
  },
  {
    id: 30,
    title: "Accounting Services",
    description:
      "Professional accounting and financial management services for businesses.",
    image: "/images/accounting.jpg?height=300&width=400",
    date: "Finance",
    comments: "Accurate",
  },
  {
    id: 31,
    title: "Training & Education",
    description:
      "Professional training and educational services for skill development.",
    image: "/images/training.png?height=300&width=400",
    date: "Learn",
    comments: "Growth",
  },
  {
    id: 32,
    title: "Healthcare Services",
    description:
      "Comprehensive healthcare consulting and medical services management.",
    image: "/images/service9.jpg?height=300&width=400",
    date: "Health",
    comments: "Care",
  },
  {
    id: 33,
    title: "Fitness & Wellness",
    description:
      "Professional fitness training and wellness programs for healthy living.",
    image: "/images/fitness.jpg?height=300&width=400",
    date: "Fitness",
    comments: "Wellness",
  },
  {
    id: 34,
    title: "Beauty & Salon Services",
    description:
      "Professional beauty and salon services for personal care and grooming.",
    image: "/images/beauty.jpg?height=300&width=400",
    date: "Beauty",
    comments: "Style",
  },
  {
    id: 35,
    title: "Automotive Services",
    description:
      "Professional automotive services including maintenance, repair, and detailing.",
    image: "/images/repair.jpg?height=300&width=400",
    date: "Auto",
    comments: "Service",
  },
  {
    id: 36,
    title: "Repair & Maintenance",
    description:
      "Comprehensive repair and maintenance services for residential and commercial properties.",
    image: "/images/construction.jpg?height=300&width=400",
    date: "Repair",
    comments: "Maintenance",
  },
  {
    id: 37,
    title: "Logistics & Supply Chain",
    description:
      "Professional logistics and supply chain management solutions for businesses.",
    image: "/images/logistics.png?height=300&width=400",
    date: "Logistics",
    comments: "Efficient",
  },
  {
    id: 38,
    title: "Import & Export Services",
    description:
      "Professional import/export consulting and international trade facilitation.",
    image: "/images/import.jpg?height=300&width=400",
    date: "Trade",
    comments: "Global",
  },
  {
    id: 39,
    title: "Insurance Services",
    description:
      "Comprehensive insurance consulting and risk management services.",
    image: "/images/insurance.jpg?height=300&width=400",
    date: "Insurance",
    comments: "Protected",
  },
  {
    id: 40,
    title: "Banking & Financial Services",
    description:
      "Professional banking and financial consulting services for businesses and individuals.",
    image: "/images/banking.jpg?height=300&width=400",
    date: "Banking",
    comments: "Financial",
  },
  {
    id: 41,
    title: "Telecommunications",
    description:
      "Professional telecommunications consulting and network solutions.",
    image: "/images/telcommini.jpg?height=300&width=400",
    date: "Telecom",
    comments: "Connected",
  },
  {
    id: 42,
    title: "Hospitality Services",
    description:
      "Professional hospitality consulting and hotel management services.",
    image: "/images/hospitality.jpg?height=300&width=400",
    date: "Hospitality",
    comments: "Service",
  },
  {
    id: 43,
    title: "Tourism Services",
    description:
      "Professional tourism consulting and travel management services.",
    image: "/images/tourism.jpg?height=300&width=400",
    date: "Tourism",
    comments: "Travel",
  },
  {
    id: 44,
    title: "Entertainment Services",
    description:
      "Professional entertainment services and event management solutions.",
    image: "/images/event.jpg?height=300&width=400",
    date: "Entertainment",
    comments: "Fun",
  },
  {
    id: 45,
    title: "Other Services",
    description:
      "Custom services tailored to your specific business needs and requirements.",
    image: "/images/other-service.jpg?height=300&width=400",
    date: "Custom",
    comments: "Solutions",
  },
];

export default function ServicesSection() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-5">
          <h2 className="text-2xl font-bold text-[#0066FF]">Our Services</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex">
                <div className="relative w-2/5 h-48">
                  <img
                    src={service.image || "/images/vertex-conslting.jpg"}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#0066FF]/90 text-white rounded-lg px-2 py-1 backdrop-blur-sm">
                    <div className="text-lg font-bold leading-none">
                      {service.id.toString().padStart(2, "0")}
                    </div>
                    <div className="text-xs opacity-90">{service.date}</div>
                  </div>
                </div>
                <div className="w-3/5 p-4 flex flex-col justify-between bg-[#E1EBE2]">
                  <div>
                    <h3 className="text-[16px] font-bold text-gray-900 mb-2 leading-tight">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 text-[14px] leading-relaxed mb-3">
                      {service.description}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center text-gray-500 text-[14px] cursor-pointer">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      <span>{service.comments}</span>
                    </div>
                    <div>
                      <Link href={"/contact/#contact-form"}>
                        <Send className="w-4 h-4 text-[#F17105] cursor-pointer" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
