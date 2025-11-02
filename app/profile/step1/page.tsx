import HealthProfileForm from '@/components/forms/HealthProfileForm';

export default function HealthProfilePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Step 1: Health Profile</h1>
          <p className="text-gray-600">Let's start with your basic health information</p>
        </div>
        <HealthProfileForm />
      </div>
    </div>
  );
}
