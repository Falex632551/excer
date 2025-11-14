import type { WorkoutProgram } from '../types';

// Type definition for the google.script.run interface
// This helps with type safety when calling App Script functions
interface ServerFunctions {
  saveProgram: (program: WorkoutProgram) => void;
  loadPrograms: () => void;
  deleteProgram: (programId: string) => void;
}

// Fix: Corrected the type definitions for google.script.run to allow chaining of handlers.
// The previous types incorrectly stated that `withSuccessHandler` returned a type
// that did not include `withFailureHandler`, breaking the call chain.
interface GoogleScriptRun extends ServerFunctions {
  withSuccessHandler(callback: (result: any) => void): GoogleScriptRun;
  withFailureHandler(callback: (error: Error) => void): GoogleScriptRun;
}

// Augment the window object to include the google property
declare global {
  interface Window {
    google?: {
      script: {
        run: GoogleScriptRun;
      };
    };
  }
}

const isGoogleScriptAvailable = (): boolean => !!window.google?.script?.run;

// Mock data for local development
const MOCK_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'mock-1',
    name: 'Full Body HIIT',
    sets: 3,
    restBetweenExercises: 15,
    restBetweenSets: 60,
    exercises: [
      { id: 'ex-1', name: 'Jumping Jacks', duration: 45 },
      { id: 'ex-2', name: 'Push-ups', duration: 30 },
      { id: 'ex-3', name: 'Squats', duration: 45 },
      { id: 'ex-4', name: 'Plank', duration: 60 },
    ],
  },
  {
    id: 'mock-2',
    name: 'Abs Burner',
    sets: 4,
    restBetweenExercises: 10,
    restBetweenSets: 45,
    exercises: [
        { id: 'ex-5', name: 'Crunches', duration: 45 },
        { id: 'ex-6', name: 'Leg Raises', duration: 45 },
        { id: 'ex-7', name: 'Russian Twists', duration: 45 },
    ]
  }
];

// --- API Functions ---

export const saveProgram = (program: WorkoutProgram): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isGoogleScriptAvailable()) {
      window.google!.script.run
        .withSuccessHandler(() => resolve())
        .withFailureHandler(reject)
        .saveProgram(program);
    } else {
      console.log('Mock saving program:', program);
      // Simulate network delay
      setTimeout(() => {
        const index = MOCK_PROGRAMS.findIndex(p => p.id === program.id);
        if (index > -1) {
            MOCK_PROGRAMS[index] = program;
        } else {
            MOCK_PROGRAMS.push(program);
        }
        resolve();
      }, 500);
    }
  });
};

export const loadPrograms = (): Promise<WorkoutProgram[]> => {
  return new Promise((resolve, reject) => {
    if (isGoogleScriptAvailable()) {
      window.google!.script.run
        .withSuccessHandler((programs: WorkoutProgram[]) => resolve(programs))
        .withFailureHandler(reject)
        .loadPrograms();
    } else {
      console.log('Mock loading programs');
      // Simulate network delay
      setTimeout(() => {
        resolve(JSON.parse(JSON.stringify(MOCK_PROGRAMS))); // Deep copy
      }, 500);
    }
  });
};

export const deleteProgram = (programId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isGoogleScriptAvailable()) {
      window.google!.script.run
        .withSuccessHandler(() => resolve())
        .withFailureHandler(reject)
        .deleteProgram(programId);
    } else {
      console.log('Mock deleting program:', programId);
      // Simulate network delay
      setTimeout(() => {
        const index = MOCK_PROGRAMS.findIndex(p => p.id === programId);
        if(index > -1) MOCK_PROGRAMS.splice(index, 1);
        resolve();
      }, 500);
    }
  });
};
