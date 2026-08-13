import React, { useState } from 'react';
import { Play, Pause, Volume2, Maximize, Settings, SkipForward, Rewind } from 'lucide-react';
import { OptimizedImage } from '../ui/OptimizedImage';

export function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="relative w-full aspect-video bg-primary-900 rounded-2xl overflow-hidden shadow-lg group flex flex-col">
      {/* Video Placeholder */}
      <OptimizedImage priority displayWidth={1200} width="1200" height="675"
        src="https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=1200&auto=format&fit=crop"
        alt="Video Thumbnail"
        className="w-full h-full object-cover opacity-60"
      />

      {/* Play/Pause Center Button (Visible when paused) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary-900/40">
          <button
            onClick={() => setIsPlaying(true)}
            className="w-20 h-20 bg-accent-600/90 text-white rounded-full flex items-center justify-center hover:bg-accent-500 hover:scale-110 transition-all shadow-xl backdrop-blur-sm"
          >
            <Play className="w-8 h-8 fill-current ms-1" />
          </button>
        </div>
      )}

      {/* Controls Bar (Visible on hover or when playing) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary-900/90 to-transparent p-4 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">

        {/* Progress Bar */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-white text-xs font-medium w-10 text-center">12:34</span>
          <div className="flex-grow h-1.5 bg-white/30 rounded-full cursor-pointer relative group/progress">
            <div className="absolute h-full bg-accent-500 rounded-full w-[45%]"></div>
            <div className="absolute w-3 h-3 bg-white rounded-full shadow top-1/2 -translate-y-1/2 left-[55%] opacity-0 group-hover/progress:opacity-100 transform -translate-x-1/2 transition-opacity"></div>
          </div>
          <span className="text-white text-xs font-medium w-10 text-center">25:00</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center sm:gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:text-accent-400 transition-colors min-w-11 min-h-11 flex items-center justify-center"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>
            <button className="text-white hover:text-accent-400 transition-colors hidden sm:flex min-w-11 min-h-11 items-center justify-center">
              <Rewind className="w-5 h-5" />
            </button>
            <button className="text-white hover:text-accent-400 transition-colors hidden sm:flex min-w-11 min-h-11 items-center justify-center">
              <SkipForward className="w-5 h-5" />
            </button>
            <div className="flex items-center group/volume relative">
              <button className="text-white hover:text-accent-400 transition-colors min-w-11 min-h-11 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </button>
              <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 h-1.5 bg-white/30 rounded-full cursor-pointer relative ml-2">
                 <div className="absolute h-full bg-accent-500 rounded-full w-[80%]"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center sm:gap-2">
            <button className="text-white text-sm font-bold hover:text-accent-400 transition-colors border border-white/30 px-2 py-1 rounded min-w-11 min-h-11 flex items-center justify-center">
              1.25x
            </button>
            <button className="text-white hover:text-accent-400 transition-colors min-w-11 min-h-11 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </button>
            <button className="text-white hover:text-accent-400 transition-colors min-w-11 min-h-11 flex items-center justify-center">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
