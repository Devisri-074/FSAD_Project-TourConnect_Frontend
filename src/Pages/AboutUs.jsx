import { MapPin, ShieldCheck, HeartPulse, Globe, Users, Navigation } from "lucide-react";
import { Link } from "react-router-dom";

function AboutUs() {
  return (
    <div className="min-h-screen relative font-sans pb-20 text-white z-0 pt-16">
      
      {/* 🔹 FIXED BACKGROUND IMAGE */}
      <img
        src="https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=2000&auto=format&fit=crop"
        alt="bg"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -2,
        }}
      />
      {/* 🔹 DARK OVERLAY */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.65)",
          zIndex: -1,
        }}
      />

      {/* HERO SECTION */}
      <div className="relative pt-24 pb-20 px-6 sm:px-12 lg:px-24 mx-auto max-w-7xl flex flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-yellow-400 text-sm font-semibold tracking-wider uppercase shadow-sm backdrop-blur-md">
          <Globe size={16} /> Rediscover Travel
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 drop-shadow-md">
          Seamless Journeys. <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Unforgettable Memories.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl leading-relaxed mb-10 drop-shadow">
          TourConnect is an innovative platform dedicated to transforming how people explore the world. By connecting passionate local guides, authentic homestays, and eager tourists, we build bridges across cultures securely and affordably.
        </p>
        <Link 
           to="/explore" 
           className="px-8 py-4 bg-yellow-500 text-gray-900 rounded-xl font-bold text-lg hover:bg-yellow-400 transition hover:-translate-y-1 shadow-xl flex items-center gap-3"
        >
          <Navigation size={22} fill="currentColor"/> Start Your Journey
        </Link>
      </div>

      {/* MISSION STRIP */}
      <div className="bg-white/10 backdrop-blur-xl border-y border-white/10 shadow-lg py-16 px-6 relative z-10">
         <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 items-center">
             <div className="flex-1 space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow">Our Mission</h2>
                <p className="text-gray-200 text-lg leading-relaxed">
                   We believe travel should be accessible, organized, and deeply personal. Our platform aims to empower local communities by allowing residents to act as hosts and guides, offering tourists an authentic, immersive, and verified gateway to the world's most beautiful destinations.
                </p>
             </div>
             <div className="flex-1 relative">
                <img 
                   src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop" 
                   alt="Mission Team" 
                   className="rounded-[2rem] shadow-2xl border border-white/20 w-full h-auto object-cover transform transition duration-500 hover:scale-[1.02]"
                />
             </div>
         </div>
      </div>

      {/* CORE VALUES */}
      <div className="py-24 px-6 max-w-7xl mx-auto">
         <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 drop-shadow">Why Choose TourConnect?</h2>
            <p className="text-gray-300 max-w-2xl mx-auto drop-shadow">Our rigorous verification protocols paired with highly tailored itineraries provide everything you need for the perfect trip.</p>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ValueCard 
               icon={<ShieldCheck size={32} className="text-blue-400" />}
               bgColor="bg-blue-400/20 border-blue-400/30"
               title="Secure & Verified"
               desc="Every host and local guide undergoes a rigorous verification process to ensure absolute safety and top-tier hospitality for all tourists."
            />
            <ValueCard 
               icon={<HeartPulse size={32} className="text-rose-400" />}
               bgColor="bg-rose-400/20 border-rose-400/30"
               title="Authentic Experiences"
               desc="Skip the generic hotels. We map your stays with real local families and cultural native guides to fully immerse you in the local energy."
            />
            <ValueCard 
               icon={<Users size={32} className="text-emerald-400" />}
               bgColor="bg-emerald-400/20 border-emerald-400/30"
               title="Community Driven"
               desc="Your spending goes straight into the pockets of the local community, promoting sustainable tourism economies worldwide."
            />
         </div>
      </div>

      {/* FOOTER CALLOUT */}
      <div className="max-w-4xl mx-auto mt-10 px-6">
         <div className="bg-black/50 backdrop-blur-xl border border-white/20 rounded-3xl p-10 md:p-14 text-center shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
               <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to join the ecosystem?</h3>
               <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">Whether you're looking to explore new horizons, guide tourists through your hometown, or host travelers in your beautiful property.</p>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/signup" className="px-8 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition shadow-lg">Become a Member</Link>
                  <Link to="/login" className="px-8 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition backdrop-blur-md border border-white/30">Sign In Now</Link>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}

function ValueCard({ icon, title, desc, bgColor }) {
   return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group cursor-pointer relative overflow-hidden">
         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${bgColor} group-hover:scale-110 transition-transform`}>
            {icon}
         </div>
         <h4 className="text-xl font-bold text-white mb-3">{title}</h4>
         <p className="text-gray-300 leading-relaxed text-sm lg:text-base">{desc}</p>
         <div className="absolute -bottom-1 -right-1 opacity-10 mix-blend-screen pointer-events-none transform scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
             {icon}
         </div>
      </div>
   )
}

export default AboutUs;
