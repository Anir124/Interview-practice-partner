import { Mic, MicOff } from "lucide-react";

interface FloatingMicButtonProps {
  isRecording: boolean;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

const FloatingMicButton = ({ isRecording, onStart, onStop, disabled }: FloatingMicButtonProps) => {
  return (
    <button
      onMouseDown={onStart}
      onMouseUp={onStop}
      onTouchStart={onStart}
      onTouchEnd={onStop}
      disabled={disabled}
      className={`
        relative w-20 h-20 rounded-full flex items-center justify-center
        transition-all duration-300 shadow-glow-strong
        ${isRecording 
          ? 'bg-destructive text-destructive-foreground scale-110' 
          : 'bg-gradient-to-br from-primary to-accent text-primary-foreground mic-pulse hover:scale-105'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isRecording ? (
        <MicOff className="w-9 h-9" />
      ) : (
        <Mic className="w-9 h-9" />
      )}
      
      {!isRecording && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-xl" />
      )}
    </button>
  );
};

export default FloatingMicButton;
