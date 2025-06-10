"use client";
import { signIn,useSession,signOut } from "next-auth/react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Music } from "lucide-react"
import Link from "next/link"

export function Appbar(){
    const session = useSession();
    return <div className="flex justify-between px-20 pt-4">
           <div className="text-4xl font-bold flex flex-col justify-center ">
            PlayB
            <div className="text-xl flex-col justify-center">
                better & best
            </div>
           </div>
           <div>
           {session.data?.user &&<Button className="bg-orange-500 text-white hover:bg-orange-400 transition-colors mr-5" style={{ marginTop: '0.35cm' }} onClick={() => signOut()}>Logout</Button>}
           {!session.data?.user &&<Button className="bg-orange-500 text-black hover:bg-orange-400 transition-colors mr-5" style={{ marginTop: '0.35cm' }} onClick={() => signIn()}>Sign In</Button>}
           </div>
    </div>}