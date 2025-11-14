
import React, { useState, useEffect, useCallback } from 'react';
import ProgramEditor from './components/ProgramEditor';
import WorkoutTimer from './components/WorkoutTimer';
import type { WorkoutProgram, View } from './types';
import { loadPrograms, saveProgram, deleteProgram } from './services/api';
import { PlayIcon, EditIcon, TrashIcon, PlusIcon } from './components/icons';

const ProgramCard: React.FC<{
    program: WorkoutProgram;
    onStart: (program: WorkoutProgram) => void;
    onEdit: (program: WorkoutProgram) => void;
    onDelete: (id: string) => void;
}> = ({ program, onStart, onEdit, onDelete }) => {
    const totalDuration = program.exercises.reduce((sum, ex) => sum + ex.duration, 0) * program.sets +
                        program.restBetweenExercises * (program.exercises.length > 0 ? program.exercises.length - 1 : 0) * program.sets +
                        program.restBetweenSets * (program.sets > 0 ? program.sets - 1 : 0);
    const totalMinutes = Math.floor(totalDuration / 60);

    return (
        <div className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between transition-transform transform hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/10">
            <div>
                <h3 className="text-xl font-bold text-cyan-400">{program.name}</h3>
                <div className="text-gray-400 text-sm mt-2 space-y-1">
                    <p>{program.exercises.length} exercises</p>
                    <p>{program.sets} sets</p>
                    <p>~ {totalMinutes} min</p>
                </div>
            </div>
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                     <button onClick={() => onEdit(program)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"><EditIcon /></button>
                     <button onClick={() => onDelete(program.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-700 rounded-full transition-colors"><TrashIcon /></button>
                </div>
                <button
                    onClick={() => onStart(program)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-transform transform hover:scale-105"
                >
                    <PlayIcon /> Start
                </button>
            </div>
        </div>
    );
};


const App: React.FC = () => {
  const [view, setView] = useState<View>('PROGRAM_LIST');
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedPrograms = await loadPrograms();
      setPrograms(loadedPrograms);
    } catch (error) {
      console.error('Failed to load programs:', error);
      // You can add user-facing error handling here
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleSaveProgram = async (program: WorkoutProgram) => {
    await saveProgram(program);
    fetchPrograms();
    setView('PROGRAM_LIST');
    setSelectedProgram(null);
  };

  const handleDeleteProgram = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
        await deleteProgram(id);
        fetchPrograms();
    }
  };

  const handleStartWorkout = (program: WorkoutProgram) => {
    setSelectedProgram(program);
    setView('WORKOUT_TIMER');
  };

  const handleEditProgram = (program: WorkoutProgram) => {
    setSelectedProgram(program);
    setView('PROGRAM_EDITOR');
  }

  const handleCreateNew = () => {
    setSelectedProgram(null);
    setView('PROGRAM_EDITOR');
  }

  const renderView = () => {
    switch (view) {
      case 'PROGRAM_EDITOR':
        return (
          <ProgramEditor
            programToEdit={selectedProgram}
            onSave={handleSaveProgram}
            onCancel={() => setView('PROGRAM_LIST')}
          />
        );
      case 'WORKOUT_TIMER':
        return (
          selectedProgram && (
            <WorkoutTimer
              program={selectedProgram}
              onFinish={() => {
                setView('PROGRAM_LIST');
                setSelectedProgram(null);
              }}
            />
          )
        );
      case 'PROGRAM_LIST':
      default:
        return (
          <div className="p-4 sm:p-6 max-w-4xl mx-auto">
            <header className="flex justify-between items-center mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">Workout Programs</h1>
              <button onClick={handleCreateNew} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-transform transform hover:scale-105">
                <PlusIcon /> New
              </button>
            </header>
            {isLoading ? (
              <p>Loading programs...</p>
            ) : programs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programs.map((p) => (
                  <ProgramCard 
                    key={p.id} 
                    program={p} 
                    onStart={handleStartWorkout}
                    onEdit={handleEditProgram}
                    onDelete={handleDeleteProgram}
                  />
                ))}
              </div>
            ) : (
                <div className="text-center py-16 px-6 bg-gray-800 rounded-lg">
                    <h2 className="text-xl text-gray-300 mb-4">No workout programs found.</h2>
                    <p className="text-gray-400 mb-6">Create your first program to get started!</p>
                    <button onClick={handleCreateNew} className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-500 transition-transform transform hover:scale-105">
                        <PlusIcon /> Create Program
                    </button>
                </div>
            )}
          </div>
        );
    }
  };

  return <div className="min-h-screen bg-gray-900">{renderView()}</div>;
};

export default App;
