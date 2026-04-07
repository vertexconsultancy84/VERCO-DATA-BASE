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
    title: "Paints & Coatings",
    description:
      "Consulting services for paint, varnish, and coating manufacturing processes.",
    image: "/images/service5.jpg?height=300&width=400",
    date: "Quality",
    comments: "Coatings",
  },
  

  {
    id: 5,
    title: "Global Trading Services",
    description:
      "International trade consulting and global market entry strategies for businesses.",
    image: "/images/global-trade.jpg?height=300&width=400",
    date: "Global",
    comments: "Reach",
  },
  {
    id: 6,
    title: "Wholesale Trade",
    description:
      "Non-specialized wholesale trade consulting and distribution network optimization.",
    image: "/images/wholesale.jpg?height=300&width=400",
    date: "Trade",
    comments: "Networks",
  },

 
  {
    id: 7,
    title: "Cargo Handling",
    description:
      "Professional logistics and cargo handling consulting for efficient operations.",
    image: "/images/corgo.jpg?height=300&width=400",
    date: "Logistics",
    comments: "Solutions",
  },
  {
    id: 8,
    title: "Technical Testing & Analysis",
    description:
      "Comprehensive technical testing and analysis services for quality assurance.",
    image: "/images/technical-testing.jpg?height=300&width=400",
    date: "Quality",
    comments: "Testing",
  },
  {
    id: 9,
    title: "Tax consultation, Product, Pricing Strategy",
    description:
      "Tax advisory, product maketing, and pricing strategy with industries",
    image: "/images/service3.jpg?height=300&width=400",
    date: "Quality",
    comments: "Testing",
  },
    {
    id: 10,
    title: "Chemical Manufacturing",
    description:
      "Professional consulting for basic chemicals manufacturing and production optimization.",
    image: "/images/service6.jpg?height=300&width=400",
    date: "Quality",
    comments: "Assured",
  },
  {
    id: 11,
    title: "Food Delivery",
    description:
      "Professional food delivery services connecting restaurants with customers for convenient meal delivery.",
    image: "/images/food-delivery.jpg?height=300&width=400",
    date: "24/7",
    comments: "Delivery",
  },
  {
    id: 12,
    title: "House & Apartment Rentals",
    description:
      "Comprehensive rental services for houses, apartments, and residential properties with flexible terms.",
    image: "/images/real-estate.jpg?height=300&width=400",
    date: "Homes",
    comments: "Available",
  },
  {
    id: 13,
    title: "Real Estate Services",
    description:
      "Professional real estate consulting, property management, and investment advisory services.",
    image: "/images/real-estate.jpg?height=300&width=400",
    date: "Property",
    comments: "Expert",
  },
  {
    id: 14,
    title: "Property Management",
    description:
      "Complete property management services for residential and commercial properties.",
    image: "/images/service4.jpg?height=300&width=400",
    date: "Managed",
    comments: "Care",
  },
  {
    id: 15,
    title: "Construction Services",
    description:
      "Professional construction consulting and project management for residential and commercial projects.",
    image: "/images/service5.jpg?height=300&width=400",
    date: "Build",
    comments: "Quality",
  },
  {
    id: 16,
    title: "Interior Design",
    description:
      "Creative interior design services for homes, offices, and commercial spaces.",
    image: "/images/interio-design.jpg?height=300&width=400",
    date: "Design",
    comments: "Creative",
  },
 
 
  {
    id: 17,
    title: "Transportation Services",
    description:
      "Reliable transportation and logistics services for goods and passengers.",
    image: "/images/transportation.jpg?height=300&width=400",
    date: "Transit",
    comments: "Reliable",
  },
  {
    id: 18,
    title: "Event Planning",
    description:
      "Professional event planning and management services for corporate and private events.",
    image: "/images/event.jpg?height=300&width=400",
    date: "Events",
    comments: "Managed",
  },
  {
    id: 19,
    title: "Photography & Videography",
    description:
      "Professional photography and videography services for events, products, and marketing.",
    image: "/images/photography.jpg?height=300&width=400",
    date: "Visual",
    comments: "Creative",
  },
 
  {
    id: 20,
    title: "Digital Marketing",
    description:
      "Comprehensive digital marketing strategies to grow your online presence.",
    image: "/images/digital-marketing.jpg?height=300&width=400",
    date: "Marketing",
    comments: "Growth",
  },
  {
    id: 21,
    title: "IT Support Services",
    description:
      "Professional IT support and technical services for businesses and individuals.",
    image: "/images/IT-suport.jpg?height=300&width=400",
    date: "Tech",
    comments: "Support",
  },
  {
    id: 22,
    title: "Legal Services",
    description:
      "Professional legal consulting and advisory services for businesses and individuals.",
    image: "/images/legal.jpg?height=300&width=400",
    date: "Legal",
    comments: "Expert",
  },
  {
    id: 23,
    title: "Accounting Services",
    description:
      "Professional accounting and financial management services for businesses.",
    image: "/images/accounting.jpg?height=300&width=400",
    date: "Finance",
    comments: "Accurate",
  },
  {
    id: 24,
    title: "Training & Education",
    description:
      "Professional training and educational services for skill development.",
    image: "/images/training.png?height=300&width=400",
    date: "Learn",
    comments: "Growth",
  },
 
 
  {
    id: 25,
    title: "Repair & Maintenance",
    description:
      "Comprehensive repair and maintenance services for residential and commercial properties.",
    image: "/images/construction.jpg?height=300&width=400",
    date: "Repair",
    comments: "Maintenance",
  },
  {
    id: 26,
    title: "Logistics & Supply Chain",
    description:
      "Professional logistics and supply chain management solutions for businesses.",
    image: "/images/logistics.png?height=300&width=400",
    date: "Logistics",
    comments: "Efficient",
  },
 
  {
    id: 27,
    title: "Insurance Services",
    description:
      "Comprehensive insurance consulting and risk management services.",
    image: "/images/insurance.jpg?height=300&width=400",
    date: "Insurance",
    comments: "Protected",
  },
  
  {
    id: 28,
    title: "Hospitality Services",
    description:
      "Professional hospitality consulting and hotel management services.",
    image: "/images/hospitality.jpg?height=300&width=400",
    date: "Hospitality",
    comments: "Service",
  },
  
  {
    id: 29,
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
