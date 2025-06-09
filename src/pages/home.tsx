export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">Isometric Engine</h1>
        <p className="text-xl mb-8">Moteur de rendu isométrique 3D</p>
        <a href="/proto" className="bg-white hover:bg-zinc-200 px-6 py-3 rounded-lg text-black font-semibold transition-colors">Prototype</a>
      </div>
    </div>
  )
}