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

          {/* AI Assistant Showcase Section */}
          <div className="pt-12 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 shadow-lg border border-green-200">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Icon Section */}
                <div className="flex-shrink-0">
                  <div className="text-6xl md:text-8xl">🤖</div>
                </div>

                {/* Content Section */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    AI Nutrition Assistant
                  </h2>
                  <p className="text-lg text-gray-700 mb-4">
                    Get instant help with your meal plan! Our AI assistant can:
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-start justify-center md:justify-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-gray-700">Replace individual meals</span>
                    </li>
                    <li className="flex items-start justify-center md:justify-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-gray-700">Answer nutrition questions</span>
                    </li>
                    <li className="flex items-start justify-center md:justify-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-gray-700">Suggest alternatives</span>
                    </li>
                    <li className="flex items-start justify-center md:justify-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-gray-700">Explain nutritional content</span>
                    </li>
                  </ul>
                  <p className="text-sm text-gray-600 italic">
                    💬 Available on your meal plan page - just click the chatbot icon!
                  </p>
                </div>
              </div>
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
