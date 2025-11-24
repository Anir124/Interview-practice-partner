const BouncingSphere = () => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bounce-sphere w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent pulse-glow shadow-glow-strong" />
      <p className="text-sm text-primary font-medium mt-6">AI is speaking...</p>
    </div>
  );
};

export default BouncingSphere;
