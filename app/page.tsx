import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Zap, Radio } from "lucide-react"
import Link from "next/link"
import { Appbar } from "./components/Appbar"
import { Redirect } from "./components/Redirect"

export default function LandingPage() {
  
  return (
    <div className="flex flex-col min-h-screen bg-black text-white bg-gradient-to-br from-black via-orange-900 to-black">
      <Appbar/>
      <Redirect />
      
      <main className="flex-1 ">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                  Let The Most Favou<span className="text-orange-500">rites Get Played</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-xl text-gray-300 md:text-2xl">
                  Where creators and fans unite to create the perfect stream soundtrack.
                </p>
              </div>
              <div className="space-x-4">
                <Button className="bg-orange-500 text-black hover:bg-orange-400 transition-colors">
                  Get Started
                </Button>
                <Button variant="outline" className="border-orange-500 text-orange-400 hover:bg-orange-950 hover:text-orange-300 transition-colors">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-orange">
          <div className="container mx-auto px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-center mb-8 text-white">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <Users className="h-12 w-12 mb-4 text-black-500" />
                <h3 className="text-xl font-bold mb-2 text-white">Fan Interaction</h3>
                <p className="text-gray-600">Let fans choose your stream&rsquo;s music.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Zap className="h-12 w-12 mb-4 text-black-500" />
                <h3 className="text-xl font-bold mb-2 text-white">Real-time Voting</h3>
                <p className="text-gray-600">Dynamic song selection through live voting.</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Radio className="h-12 w-12 mb-4 text-black-500" />
                <h3 className="text-xl font-bold mb-2 text-white">Easy Integration</h3>
                <p className="text-gray-600">Works with popular streaming platforms.</p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-black">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-orange-500">
                  Ready to Revolutionize Your Streams?
                </h2>
                <p className="mx-auto max-w-[600px] text-gray-300 md:text-xl">
                  Join PlayB today and create interactive, music-driven experiences.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <form className="flex space-x-2">
                  <Input
                    className="max-w-lg flex-1 bg-white text-black placeholder-gray-500 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Enter your email"
                    type="email"
                  />
                  <Button className="bg-orange-500 text-white hover:bg-orange-600 transition-colors" type="submit">
                    Sign Up
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t border-orange-800">
        <p className="text-xs text-gray-400">© 2025 PlayB. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:text-orange-400 transition-colors" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:text-orange-400 transition-colors" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
