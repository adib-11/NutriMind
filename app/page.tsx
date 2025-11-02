import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Banner Section */}
      <div className="relative w-full h-64 md:h-80 bg-green-600">
        <Image
          src="/banner.svg"
          alt="NutriMind Banner"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl text-center space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Welcome to NutriMind
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600">
            Your personalized meal planning assistant for Bangladesh. 
            Get smart, budget-friendly meal plans tailored to your health goals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link
              href="/profile/step1"
              className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg"
            >
              Get Started
            </Link>
          </div>

          <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-2xl mb-2">🍽️</div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Meal Plans</h3>
              <p className="text-gray-600 text-sm">
                AI-powered meal suggestions based on your preferences and health goals
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-semibold text-gray-900 mb-2">Budget Friendly</h3>
              <p className="text-gray-600 text-sm">
                Stay within your daily budget with optimized meal recommendations
              </p>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-2xl mb-2">🇧🇩</div>
              <h3 className="font-semibold text-gray-900 mb-2">Local Cuisine</h3>
              <p className="text-gray-600 text-sm">
                Authentic Bangladeshi meals with accurate local pricing
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>&copy; 2025 NutriMind. Smart Meal Planning for Bangladesh.</p>
      </footer>
    </div>
  );
}
