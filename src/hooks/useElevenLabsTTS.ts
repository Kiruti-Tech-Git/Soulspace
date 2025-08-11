import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

// Popular ElevenLabs voices
export const VOICES = {
  aria: "9BWtsMINqrJLrRacOk9x",
  sarah: "EXAVITQu4vr4xnSDxMaL",
  laura: "FGY2WhTYpPnrIDTdsKH5",
  charlotte: "XB0fDUnXU5powFXDhCwa",
  alice: "Xb7hH8MSUJpSbSDYk0k2",
  matilda: "XrExE9yKIg1WjnnlVkGX"
};

export const MODELS = {
  turbo: "eleven_turbo_v2_5",
  multilingual: "eleven_multilingual_v2"
};

interface TTSOptions {
  voice?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
}

export function useElevenLabsTTS() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const speak = useCallback(async (
    text: string, 
    options: TTSOptions = {},
    apiKey?: string
  ) => {
    if (!apiKey) {
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
        return;
      }
      
      toast({
        title: "Setup required",
        description: "Add your ElevenLabs API key in settings for premium voices.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const {
        voice = VOICES.sarah,
        model = MODELS.turbo,
        stability = 0.5,
        similarityBoost = 0.5
      } = options;

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
          },
          body: JSON.stringify({
            text,
            model_id: model,
            voice_settings: {
              stability,
              similarity_boost: similarityBoost
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setCurrentAudio(null);
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      toast({
        title: "Speech failed",
        description: "Could not generate speech. Check your API key.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentAudio, toast]);

  const stop = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
  }, [currentAudio]);

  return {
    speak,
    stop,
    isLoading,
    isPlaying: !!currentAudio
  };
}