import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";

const Home = () => {
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [interviewType, setInterviewType] = useState("Sales");
  const navigate = useNavigate();

  const handleStart = () => {
    if (!name.trim()) return;
    navigate("/interview", { state: { name: name.trim(), difficulty, interviewType } });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      handleStart();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -z-10" />

      <Card className="glass-panel-strong rounded-3xl p-12 border-none max-w-md w-full mx-4">
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <Sparkles className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Interview Practice Partner
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              AI-powered mock interviews
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              className="glass-panel rounded-2xl border-border/50 h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Interview Type</Label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger className="glass-panel rounded-2xl border-border/50 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel-strong rounded-2xl border-border/50">
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Engineer">Engineer</SelectItem>
                <SelectItem value="Retail Associate">Retail Associate</SelectItem>
                <SelectItem value="SDE">SDE (Software Development Engineer)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Difficulty Level</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="glass-panel rounded-2xl border-border/50 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-panel-strong rounded-2xl border-border/50">
                <SelectItem value="Easy">Easy (3 questions)</SelectItem>
                <SelectItem value="Medium">Medium (5 questions)</SelectItem>
                <SelectItem value="Hard">Hard (7 questions)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full mt-8 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-glow hover:shadow-glow-strong transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Start Interview
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Home;
