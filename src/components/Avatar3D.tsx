import { useEffect, useRef } from "react";

interface Avatar3DProps {
  speaking: boolean;
}

const Avatar3D = ({ speaking }: Avatar3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically load model-viewer script
    if (!customElements.get('model-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js';
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="relative">
      {speaking && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl -z-10 avatar-speaking" />
      )}
      <div
        ref={containerRef}
        className={`glass-panel-strong rounded-3xl p-6 transition-all duration-500 ${
          speaking ? "scale-105" : ""
        }`}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: `
              <model-viewer
                src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
                alt="3D Avatar"
                auto-rotate
                camera-controls
                exposure="1.0"
                shadow-intensity="1"
                style="width: 100%; height: 420px; background: transparent;"
              ></model-viewer>
            `
          }}
        />
        <div className="text-center mt-4">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
            speaking 
              ? 'bg-gradient-to-r from-primary/30 to-accent/30 text-primary-foreground' 
              : 'bg-muted/50 text-muted-foreground'
          }`}>
            <div className={`w-2 h-2 rounded-full ${speaking ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-sm font-medium">
              {speaking ? "AI Interviewer Speaking" : "Listening"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Avatar3D;
