
import React, { useEffect, useReducer, useRef, useCallback } from 'react';
import type { WorkoutProgram } from '../types';
import { PauseIcon, PlayIcon, StopIcon } from './icons';

interface WorkoutTimerProps {
  program: WorkoutProgram;
  onFinish: () => void;
}

type Phase = 'PREPARE' | 'WORK' | 'REST' | 'SET_REST' | 'DONE';
type Status = 'RUNNING' | 'PAUSED' | 'IDLE';

interface TimerState {
  phase: Phase;
  status: Status;
  timeLeft: number;
  currentSet: number;
  currentExerciseIndex: number;
  totalWorkoutTime: number;
  elapsedTime: number;
}

type TimerAction =
  | { type: 'START' }
  | { type: 'TICK' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP' }
  | { type: 'NEXT_PHASE' };

const PREPARE_TIME = 5;

function formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ program, onFinish }) => {
  const audioContextRef = useRef<AudioContext>();
  
  const playSound = useCallback((type: 'tick' | 'end' | 'start') => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.01);
    
    if (type === 'tick') {
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
    } else if (type === 'end') {
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    } else {
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime); // E5
    }
    
    oscillator.start(audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.1);
    oscillator.stop(audioContext.currentTime + 0.1);
  }, []);

  const timerReducer = (state: TimerState, action: TimerAction): TimerState => {
    switch (action.type) {
      case 'START':
        playSound('start');
        return { ...state, status: 'RUNNING', phase: 'PREPARE', timeLeft: PREPARE_TIME };
      case 'PAUSE':
        return { ...state, status: 'PAUSED' };
      case 'RESUME':
        return { ...state, status: 'RUNNING' };
      case 'STOP':
        return { ...initialState };
      case 'TICK':
        if (state.status !== 'RUNNING' || state.timeLeft <= 0) return state;
        const newTimeLeft = state.timeLeft - 1;
        if (newTimeLeft <= 3 && newTimeLeft > 0) {
            playSound('tick');
        }
        return { ...state, timeLeft: newTimeLeft, elapsedTime: state.elapsedTime + 1 };
      case 'NEXT_PHASE':
        playSound('end');
        switch (state.phase) {
          case 'PREPARE':
            return {
              ...state,
              phase: 'WORK',
              timeLeft: program.exercises[0].duration,
            };
          case 'WORK': {
            const isLastExercise = state.currentExerciseIndex === program.exercises.length - 1;
            if (isLastExercise) {
              const isLastSet = state.currentSet === program.sets;
              if (isLastSet) {
                return { ...state, phase: 'DONE', status: 'IDLE' };
              }
              return {
                ...state,
                phase: 'SET_REST',
                timeLeft: program.restBetweenSets,
              };
            }
            return {
              ...state,
              phase: 'REST',
              timeLeft: program.restBetweenExercises,
            };
          }
          case 'REST': {
            const nextExerciseIndex = state.currentExerciseIndex + 1;
            return {
              ...state,
              phase: 'WORK',
              currentExerciseIndex: nextExerciseIndex,
              timeLeft: program.exercises[nextExerciseIndex].duration,
            };
          }
          case 'SET_REST': {
            return {
              ...state,
              phase: 'WORK',
              currentSet: state.currentSet + 1,
              currentExerciseIndex: 0,
              timeLeft: program.exercises[0].duration,
            };
          }
          default:
            return state;
    }
  }
    return state;
  };
  
  const calculateTotalTime = useCallback(() => {
    const totalWorkTime = program.exercises.reduce((sum, ex) => sum + ex.duration, 0) * program.sets;
    const totalRestTime = program.restBetweenExercises * (program.exercises.length - 1) * program.sets;
    const totalSetRestTime = program.restBetweenSets * (program.sets - 1);
    return PREPARE_TIME + totalWorkTime + totalRestTime + totalSetRestTime;
  }, [program]);

  const initialState: TimerState = {
    phase: 'PREPARE',
    status: 'IDLE',
    timeLeft: PREPARE_TIME,
    currentSet: 1,
    currentExerciseIndex: 0,
    totalWorkoutTime: calculateTotalTime(),
    elapsedTime: 0,
  };
  
  const [state, dispatch] = useReducer(timerReducer, initialState);
  const currentExercise = program.exercises[state.currentExerciseIndex];
  const nextExercise = (state.phase === 'WORK' || state.phase === 'REST') && state.currentExerciseIndex < program.exercises.length - 1 
    ? program.exercises[state.currentExerciseIndex + 1] 
    : program.exercises[0];


  useEffect(() => {
    if (state.status === 'IDLE') {
        dispatch({ type: 'START' });
    }
    
    if (state.status !== 'RUNNING') return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.status]);

  useEffect(() => {
    if (state.timeLeft === 0 && state.phase !== 'DONE') {
      dispatch({ type: 'NEXT_PHASE' });
    }
  }, [state.timeLeft, state.phase]);

  const phaseConfig = {
    PREPARE: { text: "GET READY", color: "text-yellow-400", bg: "bg-yellow-500/20" },
    WORK: { text: currentExercise.name.toUpperCase(), color: "text-green-400", bg: "bg-green-500/20" },
    REST: { text: "REST", color: "text-cyan-400", bg: "bg-cyan-500/20" },
    SET_REST: { text: "SET REST", color: "text-blue-400", bg: "bg-blue-500/20" },
    DONE: { text: "WORKOUT COMPLETE!", color: "text-purple-400", bg: "bg-purple-500/20" },
  };
  
  const currentPhaseConfig = phaseConfig[state.phase];

  const getPhaseDuration = () => {
    switch (state.phase) {
        case 'PREPARE': return PREPARE_TIME;
        case 'WORK': return currentExercise.duration;
        case 'REST': return program.restBetweenExercises;
        case 'SET_REST': return program.restBetweenSets;
        default: return 1;
    }
  };

  const phaseProgress = state.phase === 'DONE' ? 1 : (getPhaseDuration() - state.timeLeft) / getPhaseDuration();
  const totalProgress = state.elapsedTime / state.totalWorkoutTime;

  if (state.phase === 'DONE') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 p-4 text-center animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-bold text-purple-400 mb-4">Workout Complete!</h1>
        <p className="text-lg text-gray-300 mb-8">Great job! You've finished the {program.name} workout.</p>
        <button
          onClick={onFinish}
          className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-lg text-xl hover:bg-cyan-500 transition-transform transform hover:scale-105"
        >
          Back to Programs
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen p-4 sm:p-6 transition-colors duration-500 ${currentPhaseConfig.bg}`}>
        <header className="flex justify-between items-center text-gray-300">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold">{program.name}</h1>
                <p>Set {state.currentSet} / {program.sets}</p>
            </div>
            <div className="text-right">
                <p className="font-mono">{formatTime(state.elapsedTime)} / {formatTime(state.totalWorkoutTime)}</p>
            </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center mb-8">
                <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-gray-700" strokeWidth="5" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                    <circle
                        className={currentPhaseConfig.color}
                        strokeWidth="5"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={2 * Math.PI * 45 * (1 - phaseProgress)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>
                <div className="z-10">
                    <h2 className={`text-3xl sm:text-4xl font-bold mb-2 ${currentPhaseConfig.color} transition-colors duration-500`}>
                        {currentPhaseConfig.text}
                    </h2>
                    <p className="text-7xl sm:text-8xl font-mono font-bold">{state.timeLeft}</p>
                </div>
            </div>

            <div className="h-20">
                <p className="text-gray-400">
                    {state.phase === 'WORK' ? 'Next: ' : ''}
                    {state.phase === 'REST' || state.phase === 'SET_REST' ? 'Next Up: ' : ''}
                </p>
                <p className="text-2xl font-semibold text-gray-200">
                    {(state.phase === 'REST' || state.phase === 'WORK') && state.currentExerciseIndex < program.exercises.length -1 && ` ${nextExercise.name}` }
                    {state.phase === 'SET_REST' && ` ${nextExercise.name}` }
                </p>
            </div>
        </main>

        <footer className="flex flex-col items-center gap-4">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${totalProgress * 100}%`, transition: 'width 1s linear' }}></div>
            </div>
            <div className="flex items-center gap-6">
                <button onClick={onFinish} className="p-4 bg-red-600/50 hover:bg-red-600 rounded-full transition-colors">
                    <StopIcon className="w-8 h-8"/>
                </button>
                {state.status === 'RUNNING' ? (
                    <button onClick={() => dispatch({ type: 'PAUSE' })} className="p-6 bg-white/90 text-gray-900 hover:bg-white rounded-full transition-colors transform hover:scale-105">
                        <PauseIcon className="w-10 h-10" />
                    </button>
                ) : (
                    <button onClick={() => dispatch({ type: 'RESUME' })} className="p-6 bg-white/90 text-gray-900 hover:bg-white rounded-full transition-colors transform hover:scale-105">
                        <PlayIcon className="w-10 h-10 pl-2" />
                    </button>
                )}
                <div className="w-16"></div>
            </div>
        </footer>
    </div>
  );
};

export default WorkoutTimer;
