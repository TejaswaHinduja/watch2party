"use client"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Landing(){
    const BE_URL=process.env.NEXT_PUBLIC_BE_URL ?? "http://localhost:4000"
    const router=useRouter();
    const [code,setCode]=useState("")
    const [username,setUsername]=useState("")
    const [vidurl,setVidurl]=useState("")
    const [isJoin,setIsJoin]=useState(false)
    const [error,setError]=useState("")
    const [loading,setLoading]=useState(false)

    async function JoinRoom(){
        if(!username.trim() || !code.trim()){
            setError("Username and room code are required")
            return
        }

        try {
            setLoading(true)
            setError("")
            const normalizedCode = code.trim()
            const res=await fetch(`${BE_URL}/api/room/${encodeURIComponent(normalizedCode)}`)
            const data=await res.json()
            if(!res.ok){
                setError(data?.message ?? "Unable to join room")
                return
            }
            sessionStorage.setItem("username",username.trim())
            router.push(`/room/${data?.code ?? normalizedCode}`)
        } catch (e) {
            console.log(e)
            setError("Failed to connect to server")
        } finally {
            setLoading(false)
        }

    }
    async function CreateRoom(){
        if(!username.trim() || !vidurl.trim()){
            setError("Username and video URL are required")
            return
        }

        try{
        setLoading(true)
        setError("")
        const res=await fetch(`${BE_URL}/api/createroom`,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                username: username.trim(),
                videoUrl:vidurl.trim()
            })
        })
        const data=await res.json()
        if (!res.ok || !data?.roomCode) {
            console.log("[Landing] create room failed", { status: res.status, data })
            setError(data?.message ?? "Unable to create room")
            return
        }
        setCode(data.roomCode)
        sessionStorage.setItem("username",username.trim())
        router.push(`/room/${data.roomCode}`)
    }catch(e){
        console.log(e)
        setError("Failed to connect to server")
        return 
    } finally {
        setLoading(false)
    }
    }

    return <main className="relative min-h-screen overflow-hidden bg-[#f7f6f2] px-4 py-8 md:px-8 md:py-12">
        <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-amber-200/60 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-orange-200/50 blur-3xl" />

        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
            <section className="rounded-3xl border border-stone-300 bg-white/95 p-7 shadow-xl md:p-10">
                <p className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold tracking-wide text-amber-800">
                    GROUP WATCH
                </p>
                <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-900 md:text-5xl">
                    Watch together in real time.
                </h1>
                <p className="mt-4 max-w-xl text-stone-600 md:text-lg">
                    Create a room, invite friends with a room code, and let the host manage playback for everyone.
                </p>

                <div className="mt-8 grid gap-3 text-sm text-stone-700 sm:grid-cols-2">
                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">Host-only playback controls</div>
                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">Promote or kick participants</div>
                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">Room code based quick join</div>
                    <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">Synced YT videos</div>
                </div>
            </section>

            <section className="rounded-3xl border border-stone-300 bg-white p-6 shadow-xl md:p-7">
                <h2 className="text-2xl font-semibold text-stone-900">Get Started</h2>
                <p className="mt-1 text-sm text-stone-600">Pick a mode, enter details, and jump in.</p>

                <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-stone-100 p-1">
                    <button
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${!isJoin ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-800"}`}
                        onClick={()=>{setIsJoin(false); setError("")}}
                    >
                        Create
                    </button>
                    <button
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${isJoin ? "bg-white text-stone-900 shadow-sm" : "text-stone-600 hover:text-stone-800"}`}
                        onClick={()=>{setIsJoin(true); setError("")}}
                    >
                        Join
                    </button>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                    <input
                        className="w-full rounded-xl border border-stone-300 px-3 py-2 outline-none transition focus:border-amber-600"
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e)=>{setUsername(e.target.value)}}
                    />

                    {!isJoin && (
                        <input
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 outline-none transition focus:border-amber-600"
                            type="text"
                            placeholder="Enter YouTube URL"
                            value={vidurl}
                            onChange={(e)=>{setVidurl(e.target.value)}}
                        />
                    )}

                    {isJoin && (
                        <input
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 font-mono outline-none transition focus:border-amber-600"
                            type="text"
                            placeholder="Enter room code"
                            value={code}
                            onChange={(e)=>{setCode(e.target.value)}}
                        />
                    )}

                    {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                    {!isJoin ? (
                        <Button className="mt-1 h-11 bg-amber-600 text-white hover:bg-amber-700" disabled={loading} onClick={CreateRoom}>{loading ? "Creating..." : "Create Room"}</Button>
                    ) : (
                        <Button className="mt-1 h-11 bg-amber-600 text-white hover:bg-amber-700" disabled={loading} onClick={JoinRoom}>{loading ? "Joining..." : "Join Room"}</Button>
                    )}
                </div>
            </section>
        </div>
    </main>
}