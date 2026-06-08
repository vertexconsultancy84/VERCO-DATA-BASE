// signup/page.tsx
import SignupForm from "@/components/SignupForm"; // path to your SignupForm
import Footer from "@/components/Footer";

export default function SignupPage() {
  return (
    <main>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10 px-4">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg border border-gray-200">
          <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">Create Your Account</h1>
          <p className="text-center text-sm text-gray-500 mb-6">Join Vertex Consulting marketplace</p>
          <SignupForm />
        </div>
      </div>
      <Footer />
    </main>
  );
}