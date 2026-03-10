import { getAllPublishedProducts } from "@/app/actions/product";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SimpleEnhancedProductCard from "@/components/SimpleEnhancedProductCard";
import { Package, Star, Users } from "lucide-react";

export default async function ViewProductsPage() {
  console.log("=== VIEW PRODUCTS PAGE DEBUG ===");
  const products = await getAllPublishedProducts();
  
  console.log("Products fetched:", products.length);
  if (products.length > 0) {
    console.log("Sample product with location:", {
      id: products[0].id,
      title: products[0].title,
      province: products[0].province,
      district: products[0].district,
      sector: products[0].sector,
      village: products[0].village
    });
  }
  console.log("=================================");

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                <Package className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              Our Products
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 max-w-3xl mx-auto leading-relaxed">
              Discover amazing products uploaded by our talented community. 
              Browse through our curated collection and find exactly what you're looking for.
            </p>
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 text-gray-50" viewBox="0 0 1440 64" fill="none">
            <path d="M0 64L60 58.7C120 53 240 43 360 37.3C480 32 600 32 720 34.7C840 37 960 43 1080 45.3C1200 48 1320 48 1380 48L1440 48V64H1380C1320 64 1200 64 1080 64C960 64 840 64 720 64C600 64 480 64 360 64C240 64 120 64 60 64H0Z" fill="currentColor"/>
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      {products && products.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{products.length}</div>
              <div className="text-gray-600 font-medium">Total Products</div>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {new Set(products.map(p => p.user.name)).size}
              </div>
              <div className="text-gray-600 font-medium">Contributors</div>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">24/7</div>
              <div className="text-gray-600 font-medium">Available</div>
            </div>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 pb-20 sm:px-6 lg:px-8">
        {products && products.length > 0 ? (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Products
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Handpicked selections from our community's best uploads
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="transform transition-all duration-500 hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <SimpleEnhancedProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-16 max-w-2xl mx-auto backdrop-blur-sm bg-white/90">
              <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-orange-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                No Products Yet
              </h3>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Be the first to share your amazing products with our community! 
                Join others in showcasing your best work.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/user/dashboard"
                  className="inline-flex items-center justify-center bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 py-4 rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Package className="w-5 h-5 mr-2" />
                  Upload a Product
                </a>
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center bg-white text-orange-600 px-8 py-4 rounded-xl border-2 border-orange-200 hover:bg-orange-50 transition-all duration-300 font-semibold text-lg"
                >
                  Create Account
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
