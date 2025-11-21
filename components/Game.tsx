import React, { useState, useCallback } from 'react';
import { quizQuestions } from '../constants';
import Card from './ui/Card';
import Button from './ui/Button';
import { Activity, ActivityCategory } from '../types';

type GameState = 'start' | 'playing' | 'finished';

interface GameProps {
  onQuizComplete: (activity: Activity) => void;
}

const ECO_POINTS_PER_QUESTION = 10;

const Game: React.FC<GameProps> = ({ onQuizComplete }) => {
  const [gameState, setGameState] = useState<GameState>('start');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const currentQuestion = quizQuestions[currentQuestionIndex];

  const startQuiz = useCallback(() => {
    quizQuestions.sort(() => Math.random() - 0.5);
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswerIndex(null);
    setShowFeedback(false);
  }, []);

  const handleAnswerSelect = (index: number) => {
    if (showFeedback) return;

    setSelectedAnswerIndex(index);
    setShowFeedback(true);
    if (index === currentQuestion.correctAnswerIndex) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerIndex(null);
      setShowFeedback(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = useCallback(() => {
    setGameState('finished');
    const pointsEarned = score * ECO_POINTS_PER_QUESTION;
    if (pointsEarned > 0) {
      const quizActivity: Activity = {
        id: new Date().toISOString(),
        category: ActivityCategory.GoodsServices,
        description: `EcoQuiz: Scored ${score}/${quizQuestions.length}!`,
        co2e: 0,
        date: new Date().toISOString(),
        ecoPoints: pointsEarned,
      };
      onQuizComplete(quizActivity);
    }
  }, [score, onQuizComplete]);

  const getButtonClass = (index: number) => {
    if (!showFeedback) {
      return '';
    }
    if (index === currentQuestion.correctAnswerIndex) {
      return '!bg-green-500 !text-white font-bold';
    }
    if (index === selectedAnswerIndex) {
      return '!bg-red-500 !text-white';
    }
    return 'opacity-70';
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">EcoQuiz</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Test your environmental knowledge and earn EcoPoints!</p>
      </div>
      
      <Card>
        {gameState === 'start' && (
          <div className="text-center p-8">
            <h2 className="text-2xl font-semibold mb-4">Ready to Play?</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Answer {quizQuestions.length} questions and see how much you know about sustainability.</p>
            <Button onClick={startQuiz} size="lg" className="w-full max-w-xs">
              Start Quiz
            </Button>
          </div>
        )}

        {gameState === 'playing' && currentQuestion && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Question {currentQuestionIndex + 1} of {quizQuestions.length}</p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">Score: {score * ECO_POINTS_PER_QUESTION} pts</p>
            </div>
            <p className="text-xl font-semibold mb-6 min-h-[6rem] flex items-center">{currentQuestion.question}</p>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showFeedback}
                  className={`w-full text-left justify-start p-4 ${getButtonClass(index)}`}
                >
                  {option}
                </Button>
              ))}
            </div>
            {showFeedback && (
              <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <p className="font-semibold text-lg mb-2">
                  {selectedAnswerIndex === currentQuestion.correctAnswerIndex ? "Correct!" : "Not quite!"}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{currentQuestion.explanation}</p>
                <Button onClick={handleNextQuestion} className="mt-4 w-full">
                  {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </Button>
              </div>
            )}
          </div>
        )}

        {gameState === 'finished' && (
           <div className="text-center p-8">
            <h2 className="text-2xl font-semibold mb-2">Quiz Complete!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">You answered</p>
            <p className="text-5xl font-bold text-emerald-600">{score} / {quizQuestions.length}</p>
            <p className="text-slate-500 dark:text-slate-400 mt-4 mb-2">correctly and earned</p>
            <p className="text-2xl font-bold text-green-600 mb-6">{score * ECO_POINTS_PER_QUESTION} EcoPoints!</p>
            <Button onClick={startQuiz} size="lg" className="w-full max-w-xs">
              Play Again
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Game;