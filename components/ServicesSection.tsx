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
    title: "Cargo Handling",
    description:
      "Professional logistics and cargo handling consulting for efficient operations.",
    image: "/images/corgo.jpg?height=300&width=400",
    date: "Logistics",
    comments: "Solutions",
  },
 
  {
    id: 4,
    title: "Tax consultation, Product, Pricing Strategy",
    description:
      "Tax advisory, product maketing, and pricing strategy with industries",
    image: "/images/service3.jpg?height=300&width=400",
    date: "Quality",
    comments: "Testing",
  },
   
  {
    id: 5,
    title: "Food Delivery",
    description:
      "Professional food delivery services connecting restaurants with customers for convenient meal delivery.",
    image: "/images/food-delivery.jpg?height=300&width=400",
    date: "24/7",
    comments: "Delivery",
  },
 
  {
    id: 6,
    title: "Real Estate Services for Sale and Rent",
    description:
      "Professional real estate consulting, property management, and investment advisory services.",
    image: "/images/real-estate.jpg?height=300&width=400",
    date: "Property",
    comments: "Expert",
  },

  {
    id: 7,
    title: "Construction Services",
    description:
      "Professional construction consulting and project management for residential and commercial projects.",
    image: "/images/service5.jpg?height=300&width=400",
    date: "Build",
    comments: "Quality",
  },
  {
    id: 8,
    title: "Interior Design",
    description:
      "Creative interior design services for homes, offices, and commercial spaces.",
    image: "/images/interio-design.jpg?height=300&width=400",
    date: "Design",
    comments: "Creative",
  },
 
 
  {
    id: 9,
    title: "Transportation Services",
    description:
      "Reliable transportation and logistics services for goods and passengers.",
    image: "/images/transportation.jpg?height=300&width=400",
    date: "Transit",
    comments: "Reliable",
  },
  

  {
    id: 10,
    title: "Photography & Videography",
    description:
      "Professional photography and videography services for events, products, and marketing.",
    image: "/images/photography.jpg?height=300&width=400",
    date: "Visual",
    comments: "Creative",
  },
 
  {
    id: 11,
    title: "Digital Marketing",
    description:
      "Comprehensive digital marketing strategies to grow your online presence.",
    image: "/images/digital-marketing.jpg?height=300&width=400",
    date: "Marketing",
    comments: "Growth",
  },
  

  {
    id: 12,
    title: "Training & Education",
    description:
      "Professional training and educational services for skill development.",
    image: "/images/training.png?height=300&width=400",
    date: "Learn",
    comments: "Growth",
  },
 

  {
    id: 13,
    title: "Logistics & Supply Chain",
    description:
      "Professional logistics and supply chain management solutions for businesses.",
    image: "/images/logistics.png?height=300&width=400",
    date: "Logistics",
    comments: "Efficient",
  },
  
  {
    id: 14,
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
