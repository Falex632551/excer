
import React, { useState } from 'react';
import type { WorkoutProgram, Exercise } from '../types';
import { PlusIcon, TrashIcon, ChevronLeftIcon, GripVerticalIcon } from './icons';

interface ProgramEditorProps {
  programToEdit?: WorkoutProgram | null;
  onSave: (program: WorkoutProgram) => void;
  onCancel: () => void;
}

const ProgramEditor: React.FC<ProgramEditorProps> = ({ programToEdit, onSave, onCancel }) => {
  const [program, setProgram] = useState<WorkoutProgram>(
    programToEdit || {
      id: '',
      name: '',
      exercises: [],
      restBetweenExercises: 10,
      restBetweenSets: 60,
      sets: 3,
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProgram({ ...program, [name]: name === 'name' ? value : parseInt(value, 10) || 0 });
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...program.exercises];
    (newExercises[index] as any)[field] = value;
    setProgram({ ...program, exercises: newExercises });
  };

  const addExercise = () => {
    setProgram({
      ...program,
      exercises: [
        ...program.exercises,
        { id: `ex-${Date.now()}`, name: '', duration: 30 },
      ],
    });
  };

  const removeExercise = (index: number) => {
    const newExercises = program.exercises.filter((_, i) => i !== index);
    setProgram({ ...program, exercises: newExercises });
  };

  const handleSave = () => {
    const programToSave = {
        ...program,
        id: program.id || `prog-${Date.now()}`,
    };
    onSave(programToSave);
  };
  
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto bg-gray-900 text-gray-200 min-h-screen">
      <header className="flex items-center mb-6">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-700 transition-colors mr-2">
          <ChevronLeftIcon />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400">
          {programToEdit ? 'Edit Program' : 'Create Program'}
        </h1>
      </header>

      <div className="space-y-6">
        <div className="p-4 bg-gray-800 rounded-lg">
          <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Program Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={program.name}
            onChange={handleInputChange}
            placeholder="e.g., Morning HIIT"
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800 rounded-lg">
                <label htmlFor="sets" className="block text-sm font-medium text-gray-400 mb-1">Sets</label>
                <input
                    type="number"
                    id="sets"
                    name="sets"
                    value={program.sets}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
                <label htmlFor="restBetweenExercises" className="block text-sm font-medium text-gray-400 mb-1">Exercise Rest (s)</label>
                <input
                    type="number"
                    id="restBetweenExercises"
                    name="restBetweenExercises"
                    value={program.restBetweenExercises}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
                <label htmlFor="restBetweenSets" className="block text-sm font-medium text-gray-400 mb-1">Set Rest (s)</label>
                <input
                    type="number"
                    id="restBetweenSets"
                    name="restBetweenSets"
                    value={program.restBetweenSets}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
            </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3 text-cyan-400">Exercises</h2>
          <div className="space-y-3">
            {program.exercises.map((exercise, index) => (
              <div key={exercise.id} className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg animate-fade-in">
                <GripVerticalIcon className="w-5 h-5 text-gray-500 cursor-grab" />
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                  placeholder="Exercise Name"
                  className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
                <input
                  type="number"
                  value={exercise.duration}
                  onChange={(e) => handleExerciseChange(index, 'duration', parseInt(e.target.value, 10) || 0)}
                  className="w-24 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                />
                <span className="text-gray-400">s</span>
                <button onClick={() => removeExercise(index)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/50 rounded-full transition-colors">
                  <TrashIcon />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addExercise} className="mt-4 flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold transition-transform transform hover:scale-105">
            <PlusIcon />
            Add Exercise
          </button>
        </div>
      </div>

      <div className="mt-8 sticky bottom-0 py-4 bg-gray-900">
        <button 
            onClick={handleSave} 
            className="w-full py-3 text-lg font-bold bg-green-600 hover:bg-green-500 rounded-lg transition-transform transform hover:scale-105 shadow-lg shadow-green-600/30"
            disabled={!program.name || program.exercises.length === 0}
        >
          Save Program
        </button>
      </div>
    </div>
  );
};

export default ProgramEditor;
