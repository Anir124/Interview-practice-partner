const WaveformVisualizer = () => {
  const bars = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {bars.map((i) => (
        <div
          key={i}
          className="waveform-bar w-1 bg-gradient-to-t from-primary to-accent rounded-full"
          style={{
            height: `${Math.random() * 60 + 20}%`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
};

export default WaveformVisualizer;
