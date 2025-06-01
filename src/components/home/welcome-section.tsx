export default function WelcomeSection() {
  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center">
          {/* Welcome Text Content */}
          <div className="md:w-2/3 pr-0 md:pr-8">
            <h2 className="text-3xl font-bold mb-4 text-black">Welcome to DanceRealmX</h2>
            <p className="text-lg mb-6 text-gray-700">
              DanceRealmX is a dynamic online platform created to empower dance educators with the resources, training, and community support needed to excel in their profession. Our platform aims to create a comprehensive ecosystem for dance educators to learn, share, connect, and grow.
            </p>
            <p className="text-lg mb-6 text-gray-700">
              Whether you're seeking to enhance your teaching methods, expand your dance repertoire, or connect with other professionals in the field, DanceRealmX provides the tools and resources necessary to achieve your goals.
            </p>
          </div>
          
          {/* Banner Image on Right Side */}
          <div className="md:w-1/3 mt-6 md:mt-0 flex justify-center">
            <img 
              src="/assets/images/bannerimgdre.png" 
              alt="Dance Educators"
              className="max-w-full h-auto max-h-80 object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}