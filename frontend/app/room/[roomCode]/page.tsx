'use client'
import { useEffect, useRef, useState } from "react"
import { useSocket } from "@/lib/useSocket"
import { useParams, useRouter } from "next/navigation"

function toYouTubeVideoId(value: string | null | undefined): string | null {
  if (!value) return null
  const maybeId = value.trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(maybeId)) return maybeId

  const match = maybeId.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([A-Za-z0-9_-]{11})/
  )
  return match?.[1] ?? null
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: {
          videoId?: string
          playerVars?: Record<string, number>
          events?: {
            onReady?: () => void
            onStateChange?: (event: { data: number }) => void
          }
        }
      ) => {
        destroy: () => void
        playVideo: () => void
        pauseVideo: () => void
        seekTo: (seconds: number, allowSeekAhead: boolean) => void
        getCurrentTime: () => number
        getPlayerState: () => number
        cueVideoById: (videoId: string) => void
      }
      PlayerState: {
        PLAYING: number
        PAUSED: number
      }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

type YouTubePlayerInstance = {
  destroy: () => void
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getPlayerState: () => number
  cueVideoById: (videoId: string) => void
}

export default function Room() {
  const params = useParams()
  const router = useRouter()
  const roomParam = params.roomCode
  const roomCode = Array.isArray(roomParam) ? roomParam[0] ?? '' : roomParam ?? ''

  const [username, setUsername] = useState(() => {
    if (typeof window === 'undefined') return ''
    return sessionStorage.getItem('username') ?? ''
  })
  const [inputName, setInputName] = useState('')
  const [apiReady, setApiReady] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)

  const {
    participants,
    videoState,
    isHost,
    roomError,
    kickedMessage,
    play,
    pause,
    seek,
    promoteParticipant,
    kickParticipant,
  } = useSocket(roomCode, username)
  const videoId = toYouTubeVideoId(videoState?.videoId)
  const playerRef = useRef<YouTubePlayerInstance | null>(null)
  const suppressHostEmitRef = useRef(false)
  const playRef = useRef(play)
  const pauseRef = useRef(pause)
  const seekRef = useRef(seek)

  useEffect(() => {
    playRef.current = play
    pauseRef.current = pause
    seekRef.current = seek
  }, [play, pause, seek])

  useEffect(() => {
    console.log("[RoomPage] state", {
      roomCode,
      username,
      inputName,
      participants,
      participantCount: participants.length,
    })
  }, [roomCode, username, inputName, participants])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.YT?.Player) {
      setApiReady(true)
      return
    }

    const existingScript = document.getElementById("youtube-iframe-api")
    if (!existingScript) {
      const script = document.createElement("script")
      script.id = "youtube-iframe-api"
      script.src = "https://www.youtube.com/iframe_api"
      document.body.appendChild(script)
    }

    const prevReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.()
      setApiReady(true)
    }
  }, [])

  useEffect(() => {
    if (!apiReady || !videoId || typeof window === "undefined" || !window.YT?.Player) return

    if (playerRef.current) {
      playerRef.current.destroy()
      playerRef.current = null
    }

    setPlayerReady(false)
    playerRef.current = new window.YT.Player("room-youtube-player", {
      videoId,
      playerVars: {
        controls: isHost ? 1 : 0,
        disablekb: isHost ? 0 : 1,
        rel: 0,
      },
      events: {
        onReady: () => {
          setPlayerReady(true)
        },
        onStateChange: (event) => {
          if (!isHost || suppressHostEmitRef.current || !playerRef.current || !window.YT?.PlayerState) {
            return
          }

          const currentTime = playerRef.current.getCurrentTime()
          if (event.data === window.YT.PlayerState.PLAYING) {
            seekRef.current(currentTime)
            playRef.current()
          }
          if (event.data === window.YT.PlayerState.PAUSED) {
            seekRef.current(currentTime)
            pauseRef.current()
          }
        },
      },
    })

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [apiReady, videoId, isHost])

  useEffect(() => {
    if (!videoState || !playerRef.current || !playerReady) return

    const player = playerRef.current
    if (typeof player?.getCurrentTime !== 'function') return

    const current = player.getCurrentTime()
    const drift = Math.abs(current - videoState.currentTime)
    const shouldSeek = drift > 1

    suppressHostEmitRef.current = true
    if (shouldSeek && typeof player?.seekTo === 'function') {
      player.seekTo(videoState.currentTime, true)
    }
    if (videoState.playState === "playing" && typeof player?.playVideo === 'function') {
      player.playVideo()
    } else if (typeof player?.pauseVideo === 'function') {
      player.pauseVideo()
    }

    const timeout = window.setTimeout(() => {
      suppressHostEmitRef.current = false
    }, 200)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [videoState, playerReady])

  useEffect(() => {
    if (!isHost || !playerReady) return
    const interval = window.setInterval(() => {
      if (!playerRef.current || !window.YT?.PlayerState) return
      if (typeof playerRef.current?.getPlayerState !== 'function') return
      if (playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) return
      if (typeof playerRef.current?.getCurrentTime !== 'function') return
      seekRef.current(playerRef.current.getCurrentTime())
    }, 2000)

    return () => {
      window.clearInterval(interval)
    }
  }, [isHost, playerReady])

  useEffect(() => {
    if (!kickedMessage) return
    alert(kickedMessage)
    sessionStorage.removeItem('username')
    router.push('/')
  }, [kickedMessage, router])

  if (!username) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] grid place-items-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-stone-300 bg-white p-6 shadow-xl">
          <h2 className="text-2xl font-semibold text-stone-900">Enter username</h2>
          <p className="mt-1 text-sm text-stone-600">Choose a name before joining this watch room.</p>
          <input
            className="mt-4 w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-amber-600"
            placeholder="Your name"
            onChange={(e) => setInputName(e.target.value)}
          />
          <button
            className="mt-4 w-full rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition hover:bg-amber-700"
            onClick={() => {
              sessionStorage.setItem('username', inputName)
              setUsername(inputName)
            }}
          >
            Join Room
          </button>
        </div>
      </div>
    )
  }

  if (!roomCode || roomCode === 'undefined') {
    return (
      <div className="min-h-screen grid place-items-center bg-[#f7f6f2] p-4">
        <h2>Invalid room link</h2>
        <p>Room code is missing in the URL.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f6f2] p-4 md:p-6">
      <div className="mx-auto w-full max-w-380">
        <header className="mb-4 flex flex-col gap-2 rounded-2xl border border-stone-300 bg-white/90 px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-900">Watch Room</h1>
            <p className="text-sm text-stone-600">Room: <span className="font-semibold text-stone-900">{roomCode}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
              {isHost ? "HOST" : "PARTICIPANT"}
            </span>
          </div>
        </header>

        {roomError && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{roomError}</p>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]">
          <section className="rounded-2xl border border-stone-300 bg-black p-2 shadow-md">
            {videoId ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                <div id="room-youtube-player" className="h-full w-full" />
                {!isHost && (
                  <div
                    className="absolute inset-0 cursor-not-allowed bg-transparent"
                    aria-hidden
                    title="Only host can control playback"
                  />
                )}
              </div>
            ) : (
              <div className="grid aspect-video place-items-center rounded-xl bg-stone-900 text-stone-300">
                No valid video is set for this room yet.
              </div>
            )}
          </section>

          <aside className="rounded-2xl border border-stone-300 bg-white p-4 shadow-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Participants</h2>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                {participants.length}
              </span>
            </div>

            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-stone-900">{p.username}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.role === "HOST" ? "bg-amber-100 text-amber-800" : "bg-stone-200 text-stone-700"}`}>
                      {p.role}
                    </span>
                  </div>

                  {isHost && p.role !== "HOST" && (
                    <div className="flex gap-2">
                      <button
                        className="flex-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
                        onClick={() => promoteParticipant(p.id)}
                      >
                        Promote
                      </button>
                      <button
                        className="flex-1 rounded-lg border border-red-300 bg-red-50 px-2 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                        onClick={() => {
                          const shouldKick = window.confirm(`Kick ${p.username} from room?`)
                          if (shouldKick) kickParticipant(p.id)
                        }}
                      >
                        Kick
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}