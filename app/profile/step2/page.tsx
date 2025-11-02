import PreferencesForm from '@/components/forms/PreferencesForm';

export default function PreferencesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Step 2: Preferences</h1>
          <p className="text-gray-600">Tell us about your dietary needs and preferences</p>
        </div>
        <PreferencesForm />
      </div>
    </div>
  );
}
