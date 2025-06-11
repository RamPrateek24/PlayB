'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Play, ChevronUp, ChevronDown, Share2, Trash2, X } from "lucide-react"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Appbar } from '../components/Appbar'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css';
import { YT_REGEX } from '../lib/utils'
//@ts-ignore
import YouTubePlayer from 'youtube-player';
import { useSession } from "next-auth/react"
import type { Session } from "next-auth"



const getVideoDetails = async (url: string) => {
  return { 
    title: "Mock Video Title",
    smallImg: "/placeholder.svg?height=90&width=160", 
    bigImg: "/placeholder.svg?height=360&width=640"  
  };
}

interface Video {
  id: string;
  type: string;
  url: string;
  extractedId: string;
  title: string;
  smallImg: string;
  bigImg: string;
  active: boolean;
  userId: string;
  upvotes: number;
  haveUpvoted: boolean;
}

interface CustomSession extends Omit<Session, 'user'> {
  user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
  };
}


const REFRESH_INTERVAL_MS = 10 * 1000;

export default function StreamView({
    creatorId,
    playVideo = false
}: {
    creatorId: string
    playVideo: boolean
}) {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoQueue, setVideoQueue] = useState<Video[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playNextLoader, setPlayNextLoader] = useState(false);
  const videoPlayerRef = useRef<HTMLDivElement>(null)
  const { data: session } = useSession() as { data: CustomSession | null }
  const [isCreator, setIsCreator] = useState(false)
  const [creatorUserId, setCreatorUserId] = useState<string | null>(null)
  const [isEmptyQueueDialogOpen, setIsEmptyQueueDialogOpen] = useState(false)
  async function refreshStreams() {
    try {
      const res = await fetch(`/api/streams/?creatorId=${creatorId}`, {
        credentials: "include",
      });
      const json = await res.json();
  
      if (json.streams && Array.isArray(json.streams)) {
        setVideoQueue(json.streams.sort((a: any, b: any) => a.upvotes < b.upvotes ? 1 : -1));
      } else {
        console.error('Streams data is missing or invalid', json);
        setVideoQueue([]);
      }
  
      setCurrentVideo((video) => {
        if (video?.id === json.activeStream?.stream?.id) {
          return video;
        }
        return json.activeStream?.stream || null;
      })
      setCreatorUserId(json.creatorUserId)
            setIsCreator(json.isCreator)
    } catch (error) {
      console.error('Error fetching streams:', error);
      setVideoQueue([]);
    }
  }

  useEffect(() => {
    refreshStreams();
    const interval = setInterval(() => {
      refreshStreams();
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [creatorId]);

  useEffect(() => {
    if (!videoPlayerRef.current || !currentVideo) return

    const player = YouTubePlayer(videoPlayerRef.current)
    player.loadVideoById(currentVideo.extractedId)
    player.playVideo()

    const eventHandler = (event: { data: number }) => {
        if (event.data === 0) {
            playNext()
        }
    }
    player.on('stateChange', eventHandler)

    return () => {
        player.destroy()
    }
}, [currentVideo, videoPlayerRef])


  useEffect(() => {
    setCanShare(!!navigator.share);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/streams/", {
      method: "POST",
      body: JSON.stringify({
        creatorId,
        url: videoUrl
      })
    })
    setVideoQueue([...videoQueue, await res.json()]);
    setLoading(false);
    setVideoUrl('');
  };

  const handleVote = (id: string, isUpvote: boolean) => {
    setVideoQueue(
      videoQueue
        .map((video) =>
          video.id === id ? { ...video, upvotes: isUpvote ? video.upvotes + 1 : video.upvotes - 1,
            haveUpvoted: !video.haveUpvoted
           } : video
        ) 
        .sort((a, b) => b.upvotes - a.upvotes)
    );
    fetch(`/api/streams/${isUpvote ? "upvote" : "downvote"}`, {
      method: "POST",
      body: JSON.stringify({ streamId: id }),
    });
  };

  const playNext = async() => {
    if (videoQueue.length > 0) {
      try {
        setPlayNextLoader(true)
        const data = await fetch('/api/streams/next', {
          method: "GET"
        });
        const json = await data.json();
        setCurrentVideo(json.stream);
        setVideoQueue(q => q.filter(x => x.id !== json.stream?.id))
      } catch(e) {
        console.error('Error playing next video:', e);
      }finally{
      setPlayNextLoader(false)
      }
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join my song voting stream!',
      text: 'Help me choose the next song to play on my stream.',
      url: `${window.location.hostname}/creator/${creatorId}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully! Your fans can now join the voting.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(`${window.location.hostname}/creator/${creatorId}`).then(() => {
        toast.success("Link copied to clipboard! Share this link with your fans.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }, (err) => {
        console.error('Error copying text: ', err);
      });
    }
  };

  const removeSong = async (streamId: string) => {
    try {
        const res = await fetch(`/api/streams/Remove?streamId=${streamId}`, {
            method: "DELETE",
        })
        if (res.ok) {
            toast.success("Song removed successfully")
            refreshStreams()
        } else {
            toast.error("Failed to remove song")
        }
    } catch (error) {
        toast.error("An error occurred while removing the song")
    }
}

  return (
    <div className="flex flex-col min-h-screen bg-[rgb(10,10,10)] text-gray-200">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <Appbar />
      <div className='flex justify-center'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-5 w-screen max-w-screen-xl pt-8'>
          <div className='col-span-3'>
            <h2 className="text-2xl font-bold mb-4 text-white">Upcoming Songs</h2>
            <section className="bg-gray-900 rounded-lg p-6">
              <div className="space-y-4">
                {videoQueue.map((Video) => (
                  <Card key={Video.id} className="bg-gray-800 border-orange-600">
                    <CardContent className="p-4 flex items-center space-x-4">
                      <div className="flex items-center gap-4">
                        <img src={Video.bigImg} alt={Video.title} className="w-30 h-20 rounded-md" />
                        <div className="flex-grow">
                          <h3 className="font-semibold text-lg mb-2 text-white">{Video.title}</h3>
                          <div className="flex items-center space-x-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => handleVote(Video.id, !Video.haveUpvoted)} className="flex items-center space-x-1 border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white">
                              {Video.haveUpvoted ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronUp className="h-4 w-4 mr-1" />}
                            </Button>
                            <span className="text-lg font-bold ml-2 text-orange-600">{Video.upvotes} votes</span>
                            {isCreator && (
                              <Button 
                                variant="outline" 
                                  size="sm"
                                  onClick={() => removeSong(Video.id)}
                                  className="bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                                  >
                                      <X className="h-4 w-4" />
                              </Button>
                             )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {videoQueue.length === 0 && (
                  <p className="text-center text-gray-400">No songs in the queue. Add some!</p>
                )}
              </div>
            </section>
          </div>
          <div className='col-span-2'>
            <div className="max-w-4xl mx-auto p-4 space-y-6 w-full">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex flex-col justify-center text-white">Streamer</h1>
                <Button onClick={handleShare} className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Share2 className="h-4 w-4 mr-2" />
                  {canShare ? 'Share' : 'Copy Link'}
                </Button>
                {isCreator && (
                                    <Button 
                                        onClick={() => setIsEmptyQueueDialogOpen(true)} 
                                        className="bg-gray-700 hover:bg-gray-600 text-white transition-colors"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Empty Queue
                                    </Button>
                                )}
              </div>

              <section className="bg-gray-600 rounded-lg p-6">
                <Card className="bg-gray-800 border-gray-700 shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    <h2 className="text-2xl font-bold mb-4 text-white">Add to Queue</h2>
                    <form onSubmit={handleSubmit} className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="Paste YouTube URL here"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        required
                        className="flex-grow bg-gray-800 text-white placeholder-gray-400 border-orange-600"
                      />
                      <Button disabled={loading} type="submit" className="bg-orange-700 hover:bg-orange-800 text-white">
                        {loading ? "Loading..." : "Add to Queue"}
                      </Button>
                    </form>
                    {videoUrl && videoUrl.match(YT_REGEX) && !loading && (
                      <div className="mt-4">
                        <LiteYouTubeEmbed title="" id={videoUrl.split("?v=")[1]} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              <section className="bg-gray-900 rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-white">Now Playing</h2>
                <Card className="bg-gray-800 border-gray-700 shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    {currentVideo ? (
                      <div>
                        {playVideo ? (
                          <div ref={videoPlayerRef} className='w-full aspect-video' />
                         
                        ) : (
                          <>
                            <img
                              src={currentVideo.bigImg}
                              alt={currentVideo.title}
                              className="w-full aspect-video object-cover rounded-md"
                            />
                            <p className="mt-2 text-center font-semibold text-white">{currentVideo.title}</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-800 flex items-center justify-center rounded-lg">
                        <p className="text-gray-400">No video playing</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {playVideo && (
                  <Button
                    disabled={playNextLoader}
                    onClick={playNext}
                    className="mt-4 w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {playNextLoader ? "Loading..." : "Play Next"}
                  </Button>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


        
