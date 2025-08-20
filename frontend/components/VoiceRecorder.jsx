import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Square, Send } from 'lucide-react';

export default function VoiceRecorder({ 
  onTranscriptionComplete, 
  onRecordingStateChange, 
  isRecording 
}) {
  const [audioData, setAudioData] = useState(new Array(50).fill(0));
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      recordedChunksRef.current = [];
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up audio visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      // Start visualization
      visualizeAudio();
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      onRecordingStateChange(true);
      setHasRecording(false);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Reset visualization
    setAudioData(new Array(50).fill(0));
    onRecordingStateChange(false);
    setHasRecording(recordedChunksRef.current.length > 0);
  };

  const visualizeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;
    
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    // Convert frequency data to visualization bars
    const bars = 50;
    const dataPoints = [];
    const binSize = Math.floor(dataArrayRef.current.length / bars);
    
    for (let i = 0; i < bars; i++) {
      const start = i * binSize;
      const end = start + binSize;
      let sum = 0;
      
      for (let j = start; j < end && j < dataArrayRef.current.length; j++) {
        sum += dataArrayRef.current[j];
      }
      
      const average = sum / binSize;
      dataPoints.push(average / 255); // Normalize to 0-1
    }
    
    setAudioData(dataPoints);
    
    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(visualizeAudio);
    }
  };

  const handleSendRecording = () => {
    // Simulate speech-to-text conversion
    const simulatedTranscriptions = [
      "Help me debug this Python error I'm encountering",
      "Can you research the latest trends in machine learning?",
      "I need assistance with my React component optimization",
      "Explain how to implement proper error handling in JavaScript",
      "What are the best practices for API security?",
      "Help me troubleshoot this database connection issue"
    ];
    
    const randomTranscription = simulatedTranscriptions[
      Math.floor(Math.random() * simulatedTranscriptions.length)
    ];
    
    // Clear the recording
    recordedChunksRef.current = [];
    setHasRecording(false);
    setRecordingTime(0);
    
    // Send transcription
    onTranscriptionComplete(randomTranscription);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Recording Visualizer - only show when recording */}
      {isRecording && (
        <div className="flex items-center gap-1 px-3 py-2 bg-red-500/10 rounded-xl border border-red-500/20">
          <div className="flex items-center gap-0.5 h-6">
            {audioData.map((amplitude, index) => (
              <div
                key={index}
                className="w-0.5 bg-red-400 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(2, amplitude * 20)}px`,
                  opacity: 0.7 + amplitude * 0.3
                }}
              />
            ))}
          </div>
          <div className="ml-2 text-xs text-red-400 font-mono">
            {formatTime(recordingTime)}
          </div>
        </div>
      )}

      {/* Recording completed state */}
      {hasRecording && !isRecording && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 rounded-xl border border-green-500/20">
          <div className="text-xs text-green-400">
            Recording ready ({formatTime(recordingTime)})
          </div>
          <Button
            onClick={handleSendRecording}
            size="sm"
            className="h-6 px-2 bg-green-500 hover:bg-green-600 text-white text-xs"
          >
            <Send className="w-3 h-3 mr-1" />
            Send
          </Button>
        </div>
      )}

      {/* Main mic button */}
      <Button
        onClick={toggleRecording}
        size="sm"
        variant="ghost"
        className={`p-2 rounded-xl transition-all duration-200 h-8 w-8 ${
          isRecording 
            ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30 animate-pulse' 
            : hasRecording
            ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20'
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
        }`}
      >
        {isRecording ? (
          <Square className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}