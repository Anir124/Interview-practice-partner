interface QuestionNumberCardProps {
  questionNumber: number;
  interviewType: string;
}

const QuestionNumberCard = ({ questionNumber, interviewType }: QuestionNumberCardProps) => {
  return (
    <div className="glass-panel rounded-3xl p-6 text-center">
      <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
        {interviewType} Round
      </div>
      <div className="text-6xl font-bold bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent">
        {questionNumber}
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Question #{questionNumber}
      </div>
    </div>
  );
};

export default QuestionNumberCard;
