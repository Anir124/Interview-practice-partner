import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Sparkles, Home, TrendingUp, Target, Lightbulb, Award } from "lucide-react";
import { useEffect, useMemo } from "react";

const Feedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const feedback = location.state?.feedback || "No feedback available.";

  useEffect(() => {
    if (!location.state?.feedback) {
      navigate("/");
    }
  }, [location.state, navigate]);

  // Parse feedback into sections
  const parsedFeedback = useMemo(() => {
    const sections = {
      scores: [] as { label: string; score: string }[],
      strengths: [] as string[],
      improvements: [] as string[],
      recommendations: [] as string[],
    };

    const lines = feedback.split('\n');
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('PERFORMANCE SCORES') || line.includes('Performance Scores')) {
        currentSection = 'scores';
      } else if (line.includes('STRENGTHS') || line.includes('Strengths')) {
        currentSection = 'strengths';
      } else if (line.includes('AREAS FOR IMPROVEMENT') || line.includes('Areas for Improvement')) {
        currentSection = 'improvements';
      } else if (line.includes('ACTIONABLE RECOMMENDATIONS') || line.includes('Recommendations')) {
        currentSection = 'recommendations';
      } else if (line && currentSection) {
        if (currentSection === 'scores') {
          const scoreMatch = line.match(/(.+?):\s*(\d+(?:.\d+)?\/10)/);
          if (scoreMatch) {
            sections.scores.push({ label: scoreMatch[1].replace(/^-\s*/, ''), score: scoreMatch[2] });
          }
        } else if (currentSection === 'strengths' && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
          sections.strengths.push(line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));
        } else if (currentSection === 'improvements' && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
          sections.improvements.push(line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));
        } else if (currentSection === 'recommendations' && (line.startsWith('-') || line.startsWith('•') || line.match(/^\d+\./))) {
          sections.recommendations.push(line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''));
        }
      }
    }

    return sections;
  }, [feedback]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Interview Feedback
              </h1>
              <p className="text-muted-foreground mt-1">Your performance analysis and recommendations</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold shadow-glow hover:shadow-glow-strong transition-all hover:scale-105 flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            New Interview
          </button>
        </div>

        {/* Performance Scores */}
        {parsedFeedback.scores.length > 0 && (
          <Card className="glass-panel-strong rounded-3xl p-8 border-none mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Performance Scores</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {parsedFeedback.scores.map((score, idx) => (
                <div key={idx} className="glass-panel rounded-2xl p-5">
                  <div className="text-sm text-muted-foreground mb-2">{score.label}</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {score.score}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          {parsedFeedback.strengths.length > 0 && (
            <Card className="glass-panel-strong rounded-3xl p-8 border-none">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Strengths</h2>
              </div>
              <ul className="space-y-4">
                {parsedFeedback.strengths.map((strength, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-foreground/90 leading-relaxed">{strength}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Areas for Improvement */}
          {parsedFeedback.improvements.length > 0 && (
            <Card className="glass-panel-strong rounded-3xl p-8 border-none">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Areas for Improvement</h2>
              </div>
              <ul className="space-y-4">
                {parsedFeedback.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <p className="text-foreground/90 leading-relaxed">{improvement}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {/* Recommendations */}
        {parsedFeedback.recommendations.length > 0 && (
          <Card className="glass-panel-strong rounded-3xl p-8 border-none">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Lightbulb className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Actionable Recommendations</h2>
            </div>
            <ul className="space-y-4">
              {parsedFeedback.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 text-primary-foreground font-bold text-sm">
                    {idx + 1}
                  </div>
                  <p className="text-foreground/90 leading-relaxed pt-1">{rec}</p>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Feedback;
