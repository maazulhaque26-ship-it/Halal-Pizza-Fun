import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  return (
    <main className="min-h-screen pt-24 bg-black">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-extrabold text-white mb-8">My Profile</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1">
            <div className="glass-card p-6 rounded-2xl border border-white/10 text-center">
              <div className="w-24 h-24 rounded-full bg-background/20 mx-auto mb-4 border-2 border-primary"></div>
              <h2 className="text-xl font-bold text-white">John Doe</h2>
              <p className="text-gray-400 text-sm mb-4">john.doe@example.com</p>
              <button className="text-primary font-bold text-sm border border-primary px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">Edit Profile</button>
            </div>
          </div>
          <div className="col-span-1 md:col-span-2">
            <div className="glass-card p-6 rounded-2xl border border-white/10 mb-6">
              <h3 className="text-lg font-bold text-white mb-4">Saved Addresses</h3>
              <div className="bg-background/5 border border-white/10 p-4 rounded-xl mb-3 flex justify-between items-center">
                <div>
                  <p className="text-white font-semibold">Home</p>
                  <p className="text-gray-400 text-sm">123 Main St, Apt 4B, NY 10001</p>
                </div>
                <button className="text-primary text-sm hover:underline">Edit</button>
              </div>
              <button className="text-primary font-bold text-sm">+ Add New Address</button>
            </div>
            
            <div className="glass-card p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4">Account Settings</h3>
              <div className="flex flex-col gap-4">
                <button className="text-left text-gray-300 hover:text-white transition-colors">Change Password</button>
                <button className="text-left text-gray-300 hover:text-white transition-colors">Notification Preferences</button>
                <button className="text-left text-red-400 hover:text-red-300 transition-colors">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
